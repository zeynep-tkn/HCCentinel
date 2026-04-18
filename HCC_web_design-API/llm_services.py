# hcc_backend_api/llm_services.py

import os
import io
from PIL import Image
from datetime import datetime
import google.generativeai as genai
from groq import Groq, APIStatusError
from openai import OpenAI

# --- Yapılandırma ---
llm_clients = {}
DOCTOR_LLM_MAP = {
    "Dr. Ayşe": "gemini-flash",
    "Dr. Can": "gemini-pro",
    "Dr. Murat": "groq-llama3-70b",
    "Dr. Elif": "groq-llama3-8b",
    "Dr. Zeynep": "deepseek-deepseek-chat",
    "default": "gemini-flash"
}

def load_keys_from_file(filepath='api_keys.txt'):
    """Verilen dosyadan API anahtarlarını okur ve bir sözlük olarak döndürür."""
    if not os.path.exists(filepath):
        return {}
    keys = {}
    with open(filepath, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                keys[key] = value
    return keys

def load_all_llms():
    """Tüm LLM servislerini başlatır ve istemcileri yapılandırır."""
    global llm_clients
    print("--- LLM Servisleri Başlatılıyor ---")

    api_keys = load_keys_from_file()

    # --- Gemini Servisini Başlat ---
    try:
        GEMINI_API_KEY = api_keys.get("GEMINI_API_KEY")
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            llm_clients['gemini'] = genai
            print("✅ Gemini Servisi: Yapılandırıldı")
        else:
            print("⚠️ UYARI: api_keys.txt dosyasında GEMINI_API_KEY bulunamadı.")
    except Exception as e:
        print(f"HATA: Gemini servisi başlatılırken bir sorun oluştu: {e}")

    # --- Groq Servisini Başlat ---
    try:
        GROQ_API_KEY = api_keys.get("GROQ_API_KEY")
        if GROQ_API_KEY:
            llm_clients['groq'] = Groq(api_key=GROQ_API_KEY)
            print("✅ Groq Servisi: Yapılandırıldı")
        else:
            print("⚠️ UYARI: api_keys.txt dosyasında GROQ_API_KEY bulunamadı.")
    except Exception as e:
        print(f"HATA: Groq servisi başlatılırken bir sorun oluştu: {e}")

# ... (Groq servisinin yapılandırma bloğu bittikten sonra)

    # --- DeepSeek / OpenRouter Servisini Başlat ---
    try:
        DEEPSEEK_API_KEY = api_keys.get("DEEPSEEK_API_KEY")
        if DEEPSEEK_API_KEY:
            # OpenRouter anahtarı kontrolü
            base_url = "https://openrouter.ai/api/v1" if DEEPSEEK_API_KEY.startswith("sk-or") else "https://api.deepseek.com/v1"
            llm_clients['deepseek'] = OpenAI(
                api_key=DEEPSEEK_API_KEY,
                base_url=base_url
            )
            print(f"✅ DeepSeek/OpenRouter Servisi: Yapılandırıldı ({'OpenRouter' if DEEPSEEK_API_KEY.startswith('sk-or') else 'Direkt'})")
        else:
            print("⚠️ UYARI: api_keys.txt dosyasında DEEPSEEK_API_KEY bulunamadı.")
    except Exception as e:
        print(f"HATA: DeepSeek servisi başlatılırken bir sorun oluştu: {e}")

        
# --- Diğer Fonksiyonlar (Aynı Kalacak) ---
# get_model_info_for_doctor, generate_radiology_report_vlm, ve 
# generate_comprehensive_report fonksiyonlarında hiçbir değişiklik yapmanıza gerek yok.
# Onlar olduğu gibi kalabilir.

def get_model_info_for_doctor(doctor_name: str) -> (object, str, str):
    """Doktora göre servis istemcisini ve model adını döndürür."""
    print("\n" + "="*40)
    print(f"🔎 DOKTOR-MODEL SEÇİMİ (İstek Zamanı: {datetime.now().strftime('%H:%M:%S')})")
    
    model_key = DOCTOR_LLM_MAP.get(doctor_name, DOCTOR_LLM_MAP["default"])
    print(f"   - Gelen Doktor Adı: '{doctor_name}'")
    print(f"   - Atanan Model Anahtarı: '{model_key}'")
    
    service_name, model_name = model_key.split('-', 1)
    client = llm_clients.get(service_name)
    
    if client:
        print(f"   - Sonuç: '{service_name}' servisinden '{model_name}' modeli kullanılacak.")
        print("="*40 + "\n")
        return client, model_name, service_name
    else:
        print(f"   - HATA: '{service_name}' servisi yüklenememiş. Varsayılan servise geçiliyor.")
        default_model_key = DOCTOR_LLM_MAP["default"]
        default_service, default_model_name = default_model_key.split('-', 1)
        print("="*40 + "\n")
        return llm_clients.get(default_service), default_model_name, default_service

async def generate_radiology_report_vlm(image_bytes: bytes, predicted_stage_label: str, doctor_name: str):
    """Sadece Gemini gibi VLM destekli modellerle çalışır ve bir sözlük döndürür."""
    client, model_name, service_name = get_model_info_for_doctor(doctor_name)
    
    if service_name != 'gemini':
        error_text = f"VLM Raporu oluşturulamadı: Seçilen doktorun modeli ('{model_name}') görüntü analizini desteklemiyor. Lütfen Gemini kullanan bir doktor seçin."
        return {"text": error_text, "model_used": "N/A"}

    if not client:
        return {"text": "VLM Raporu oluşturulamadı: Gemini servisi yüklenmedi.", "model_used": "N/A"}
    
    model_to_use = 'gemini-1.5-flash-latest' # Daha yüksek uyumluluk için latest sürümü kullanıyoruz
    model = client.GenerativeModel(model_to_use)
    prompt_template = f"""Aşağıdaki ultrason görüntüsünü değerlendir. Tanı: {predicted_stage_label}. Sadece bu görüntüye göre hastalığın mevcut evresine dair tıbbi bir rapor oluştur. Raporun başında hangi evre olduğu açıkça belirtilmeli. Ortalama 4-5 cümlelik, profesyonel ve tıbbi bir dille yazılmış, açıklayıcı ve yapılandırılmış bir **SONUÇ** bölümü üret. Giriş cümlesi ya da açıklama yapma; sadece sonuç bölümünü üret."""
    
    try:
        img_for_vlm = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        response = await model.generate_content_async([prompt_template, img_for_vlm])
        report_text = response.text.replace('\n', '<br>').replace('**', '<b>').replace('</b>', '')
        return {"text": report_text, "model_used": model_to_use}
    except Exception as e:
        return {"text": f"Gemini VLM Raporu oluşturma hatası: {e}", "model_used": model_to_use}


async def generate_comprehensive_report(context: dict, doctor_name: str):
    """Doktor seçimine göre Gemini veya Groq kullanarak bütünsel rapor oluşturur ve sözlük döndürür."""
    client, model_name, service_name = get_model_info_for_doctor(doctor_name)
    if not client:
        return {"text": "Bütünsel rapor oluşturulamadı: Uygun LLM servisi yüklenmemiş.", "model_used": "N/A"}
        
    prompt = f""" 
# GÖREV VE ROL
Sen, hepatoloji ve onkoloji alanlarında uzmanlaşmış, farklı tıbbi verileri sentezleyerek kapsamlı bir klinik değerlendirme raporu hazırlayan bir yapay zeka asistanısın. Görevin, aşağıda sunulan verileri analiz ederek bütüncül, yapılandırılmış ve profesyonel bir tıbbi rapor oluşturmaktır.

# HASTA VERİLERİ
---------------------------------
**Demografik Bilgiler:**
* **Yaş:** {context.get("patient_details", {}).get('age', 'Belirtilmemiş')}
* **Cinsiyet:** {context.get("patient_details", {}).get('gender', 'Belirtilmemiş')}
{f"**Risk Faktörleri:** Alkol: {context.get('patient_details', {}).get('alcohol_consumption', 'Bilinmiyor')}, Sigara: {context.get('patient_details', {}).get('smoking_status', 'Bilinmiyor')}"}

**ANALİZ SONUÇLARI**
---------------------------------
**1. Laboratuvar Veri Analizi:** Tahmin: {context.get('lab_result', {}).get('predicted_disease', 'N/A')}, HCC Olasılığı: %{context.get('lab_result', {}).get('hcc_probability', 0) * 100:.2f}
**2. Ultrason (USG) Analizi:** Fibrozis Evresi: {context.get('usg_result', {}).get('stage_label', 'N/A')}
**3. Manyetik Rezonans (MR) Analizi:** Nodül Sayısı: {context.get('mri_analysis', {}).get('nodule_count', 'N/A')}, Tümör Oranı: %{context.get('mri_analysis', {}).get('tumor_ratio', 'N/A')}, Evre: {context.get('mri_analysis', {}).get('stage', 'N/A')}
**4. Klinik Notlar:** {context.get("doctor_note") or "Belirtilmemiş"}

# İSTENEN RAPOR FORMATI
Aşağıdaki başlıkları kullanarak, yukarıdaki verileri sentezleyen detaylı bir rapor oluştur:
**1. Klinik Özet:**
**2. Bulguların Entegrasyonu ve Yorumlanması:**
**3. Bütünsel Risk Değerlendirmesi:**
**4. Klinik Öneri ve Sonraki Adımlar:**
**5. Doktorun Özel Notları:** (Bu bölüme sadece doktorun notunu ('{context.get("doctor_note") or "Belirtilmemiş"}') aynen aktar.)
"""
    
    try:
        if service_name == 'gemini':
            model_to_use = 'gemini-1.5-pro-latest' if model_name == 'pro' else 'gemini-1.5-flash-latest'
            model = client.GenerativeModel(model_to_use)
            response = await model.generate_content_async(prompt)
            return {"text": response.text, "model_used": model_to_use}
            
        elif service_name == 'groq':
            model_to_use = 'llama3-70b-8192' if model_name == 'llama3-70b' else 'llama3-8b-8192'
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model_to_use,
            )
            return {"text": chat_completion.choices[0].message.content, "model_used": model_to_use}

        elif service_name == 'deepseek':
            # OpenRouter kullanılıyorsa model ismine deepseek/ ekle
            client_key = getattr(client, 'api_key', '')
            final_model = "deepseek/deepseek-chat" if client_key.startswith("sk-or") else "deepseek-chat"
            
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=final_model,
            )
            return {"text": chat_completion.choices[0].message.content, "model_used": final_model}


    except APIStatusError as e:
        return {"text": f"API Hatası ({service_name}): {e.status_code} - {e.message}", "model_used": "Hata"}
    except Exception as e:
        return {"text": f"Rapor oluşturma hatası ({service_name}): {e}", "model_used": "Hata"} 