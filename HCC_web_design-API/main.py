# hcc_backend_api/main.py

# --- Gerekli Kütüphaneler ---
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
import json
from datetime import datetime
import pandas as pd
import io
from PIL import Image
import os
import tempfile
import uvicorn
from passlib.context import CryptContext
import joblib
import tensorflow as tf
import numpy as np
import nibabel as nib
from scipy.ndimage import label

# --- Yerel Dosyalar ---
from database import Base, engine, get_db, User, Patient, Evaluation
from llm_services import (
    load_all_llms,
    generate_radiology_report_vlm,
    generate_comprehensive_report
)

# --- UYGULAMA AYARLARI ---
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
app = FastAPI(title="Gelişmiş HCC Erken Teşhis Sistemi API")
origins = ["http://localhost", "http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- MODEL ve DOSYA YOLLARI ---
LAB_MODEL_PATH = 'hcc_multi_model_xgboost.joblib'
LAB_SCALER_PATH = 'hcc_scaler_multi.joblib'
USG_MODEL_PATH = 'fibroz_vgg16_model.h5'
MRI_MODEL_PATH = 'MR_model.h5'

# Global model değişkenleri
model_lab, scaler_lab, model_usg, model_mri = None, None, None, None
CLASS_NAMES = ['F0- Fibroz yok', 'F1- Hafif Fibroz', 'F2- Orta Fibroz', 'F3- Ağır Fibroz', 'F4- Siroz']

# --- PYDANTIC MODELLERİ ---
class PatientResponse(BaseModel):
    id: int
    tc: str
    name: str
    surname: str
    age: Optional[int]
    gender: Optional[str]
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class LabData(BaseModel):
    Yaş: float
    Cinsiyet: int
    Albumin: float
    ALP: float
    ALT: float
    AST: float
    BIL: float
    GGT: float

# --- YARDIMCI FONKSİYONLAR ---
def preprocess_slice_mri(slice_2d, target_size=(128, 128)):
    slice_2d = (slice_2d - np.min(slice_2d)) / (np.max(slice_2d) - np.min(slice_2d) + 1e-8)
    slice_resized = tf.image.resize(slice_2d[..., np.newaxis], target_size)
    return tf.expand_dims(slice_resized, axis=0)

def filter_predicted_volume_mri(volume, min_voxel=500):
    filtered_volume = volume.copy()
    tumor_mask = (filtered_volume == 2).astype(np.uint8)
    structure = np.ones((3, 3, 3))
    labeled_array, num_features = label(tumor_mask, structure=structure)
    for region_idx in range(1, num_features + 1):
        if np.sum(labeled_array == region_idx) < min_voxel:
            filtered_volume[labeled_array == region_idx] = 0
    return filtered_volume

def count_nodules_mri(volume):
    tumor_mask = (volume == 2).astype(np.uint8)
    structure = np.ones((3, 3, 3))
    _, num_features = label(tumor_mask, structure=structure)
    return num_features

def classify_stage_mri(tumor_ratio, nodule_count, pst_score):
    if tumor_ratio == 0 and nodule_count == 0:
        return "Evre 0 - Tümör Tespit Edilmedi"
        
    # Tümör Oranı Puanı
    if tumor_ratio <= 15:
        ratio_score = 0
    elif tumor_ratio <= 35:
        ratio_score = 1
    else:
        ratio_score = 2
        
    # Nodül Sayısı Puanı
    if nodule_count <= 1:
        nodule_score = 0
    elif nodule_count <= 3:
        nodule_score = 1
    else:
        nodule_score = 2
        
    total_score = ratio_score + nodule_score
    
    if total_score == 0:
        return "Evre A - Erken Evre"
    elif total_score in [1, 2]:
        return "Evre B - Orta Evre"
    else:
        return "Evre C - İleri Evre"

# main.py dosyasındaki bu fonksiyonu güncelleyin

async def predict_lab_risk(data: LabData):
    if model_lab is None or scaler_lab is None: raise HTTPException(status_code=500, detail="Lab modeli veya scaler yüklenmedi.")
    features_order_lab = ['Yaş', 'Cinsiyet', 'Albumin', 'ALP', 'ALT', 'AST', 'BIL', 'GGT']
    input_df_lab = pd.DataFrame([data.model_dump()], columns=features_order_lab)
    input_df_lab_scaled = scaler_lab.transform(input_df_lab)
    predictions_proba = model_lab.predict_proba(input_df_lab_scaled)[0]
    predicted_class_id = np.argmax(predictions_proba)
    disease_map = {0: "Sağlıklı", 1: "Hepatit", 2: "Fibröz", 3: "Siroz", 4: "HCC"}
    predicted_disease = disease_map.get(predicted_class_id, "Bilinmiyor")
    
    # --- DÜZELTME BURADA ---
    # NumPy float32'yi standart Python float'a çeviriyoruz
    hcc_prob = float(predictions_proba[4]) if len(predictions_proba) > 4 else 0.0
    
    risk_level = "Yüksek Risk" if hcc_prob >= 0.66 else "Orta Risk" if hcc_prob >= 0.33 else "Düşük Risk"
    
    return {
        "predicted_disease": predicted_disease, 
        # --- DÜZELTME BURADA ---
        # Sonucun da standart float olduğundan emin oluyoruz
        "hcc_probability": float(hcc_prob), 
        "risk_level": risk_level
    }

def calculate_comprehensive_risk(
    lab_risk_level: str,
    usg_stage: str,
    mri_stage: str,
    afp: float,
    hbv: str,
    hcv: str,
    cancer_history: str
):
    # Risk hiyerarşisi (Sıralı liste)
    risk_order = ["Düşük Risk", "Orta Risk", "Yüksek Risk", "Çok Yüksek Risk"]
    
    # Başlangıç riskini lab modelinden al
    current_risk_idx = risk_order.index(lab_risk_level) if lab_risk_level in risk_order else 0
    final_risk_idx = current_risk_idx

    # 1. USG (Metavir) Güncellemesi
    if usg_stage:
        if "F2" in usg_stage:
            final_risk_idx = max(final_risk_idx, 1) # Orta
        elif "F3" in usg_stage:
            final_risk_idx = max(final_risk_idx, 2) # Yüksek
        elif "F4" in usg_stage or "Siroz" in usg_stage:
            final_risk_idx = max(final_risk_idx, 3) # Çok Yüksek

    # 2. MRI (Evreleme) Güncellemesi
    if mri_stage:
        # Eğer tümör varsa (Evre A, B, C veya Stage 1-4) doğrudan Çok Yüksek Risk (Tümör saptandı)
        if any(evre in mri_stage for evre in ["Evre A", "Evre B", "Evre C", "Erken", "Orta", "İleri", "Stage 1", "Stage 2", "Stage 3", "Stage 4"]):
            final_risk_idx = 3 # Çok Yüksek
        elif "Evre 0" in mri_stage or "Tümör Tespit Edilmedi" in mri_stage or "Stage 0" in mri_stage:
            final_risk_idx = max(final_risk_idx, 1) # Orta (Takip önerisi)

    # 3. Viral Durumlar (HBV/HCV)
    hbv_pos = hbv and hbv.strip().lower() in ["evet", "pozitif", "var"]
    hcv_pos = hcv and hcv.strip().lower() in ["evet", "pozitif", "var"]
    
    if hbv_pos:
        # HBV + F2/F3 ise risk Yüksek
        if usg_stage and ("F2" in usg_stage or "F3" in usg_stage):
            final_risk_idx = max(final_risk_idx, 2) # Yüksek
            
    if hcv_pos:
        # HCV + F3 ise risk Yüksek
        if usg_stage and "F3" in usg_stage:
            final_risk_idx = max(final_risk_idx, 2) # Yüksek

    # 4. AFP & Siroz (AFP eşikleri)
    is_siroz = usg_stage and ("F4" in usg_stage or "Siroz" in usg_stage)
    if is_siroz:
        if afp and afp > 400:
            final_risk_idx = 3 # Çok Yüksek (Tanısal)
        elif afp and afp > 200:
            final_risk_idx = max(final_risk_idx, 2) # Yüksek

    # 5. Kanser Öyküsü
    has_history = cancer_history and cancer_history.strip().lower() in ["evet", "var"]
    if has_history and final_risk_idx == 0:
        final_risk_idx = 1 # Orta (Risk düşükse ortamaya çek)

    return risk_order[final_risk_idx]

async def predict_usg_fibrosis(file_bytes: bytes):
    if model_usg is None: raise HTTPException(status_code=500, detail="USG modeli yüklenmedi.")
    image = Image.open(io.BytesIO(file_bytes)).convert('RGB').resize((224, 224))
    image_array = np.array(image) / 255.0
    input_tensor = np.expand_dims(image_array, axis=0)
    predictions = model_usg.predict(input_tensor, verbose=0)
    predicted_class_id = np.argmax(predictions, axis=1)[0]
    return {"stage_label": CLASS_NAMES[predicted_class_id], "stage_id": int(predicted_class_id)}

async def predict_mri_analysis(file_bytes: bytes, original_filename: str, pst_score: int = 0):
    if model_mri is None: raise HTTPException(status_code=500, detail="MR modeli yüklenmedi.")
    suffix = ".tmp"
    if original_filename.endswith((".nii.gz", ".nii")):
        suffix = ".nii.gz" if original_filename.endswith(".nii.gz") else ".nii"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        temp_filepath = tmp.name
    try:
        nii = nib.load(temp_filepath)
        volume = nii.get_fdata()
        mask_volume_list = []
        for i in range(volume.shape[2]):
            slice_2d = volume[:, :, i]
            input_tensor = preprocess_slice_mri(slice_2d)
            prediction = model_mri.predict(input_tensor, verbose=0)
            prediction_mask = tf.argmax(prediction[0], axis=-1).numpy()
            mask_volume_list.append(prediction_mask)
        mask_volume = np.array(mask_volume_list).transpose((1, 2, 0))
        total_liver_pixels = np.sum((mask_volume == 1) | (mask_volume == 2))
        total_tumor_pixels = np.sum(mask_volume == 2)
        tumor_ratio = (total_tumor_pixels / total_liver_pixels) * 100 if total_liver_pixels > 0 else 0.0
        filtered_volume = filter_predicted_volume_mri(mask_volume)
        nodule_count = count_nodules_mri(filtered_volume)
        if nodule_count == 0 and tumor_ratio > 0: nodule_count = 1
        stage = classify_stage_mri(tumor_ratio, nodule_count, pst_score)
        return {"tumor_ratio": round(tumor_ratio, 2), "nodule_count": int(nodule_count), "stage": stage}
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

# --- UYGULAMA BAŞLANGIÇ OLAYLARI ---
@app.on_event("startup")
async def load_models_on_startup():
    global model_lab, scaler_lab, model_usg, model_mri
    print("--- Makine Öğrenmesi Modelleri Yükleniyor ---")
    try:
        if os.path.exists(LAB_MODEL_PATH): model_lab = joblib.load(LAB_MODEL_PATH)
        if os.path.exists(LAB_SCALER_PATH): scaler_lab = joblib.load(LAB_SCALER_PATH)
        if os.path.exists(USG_MODEL_PATH): 
            # VGG16 modelinde Keras 3 çökmesini (Flatten bug) engellemek için mimariyi kodla kurup sadece ağırlıkları yüklüyoruz.
            model_usg = tf.keras.models.Sequential([
                tf.keras.Input((224, 224, 3), name='input_layer_1'),
                tf.keras.applications.VGG16(include_top=False, weights=None, input_shape=(224,224,3)),
                tf.keras.layers.Flatten(),
                tf.keras.layers.Dense(256),
                tf.keras.layers.Dropout(0.0),
                tf.keras.layers.Dense(5)
            ])
            model_usg.load_weights(USG_MODEL_PATH)
            
        if os.path.exists(MRI_MODEL_PATH): 
            model_mri = tf.keras.models.load_model(MRI_MODEL_PATH, compile=False)
        print("✅ Lab, USG, MRI Modelleri: Yüklendi")
    except Exception as e:
        print(f"HATA: ML modelleri yüklenirken bir sorun oluştu: {e}")
    load_all_llms()

# --- API ENDPOINT'LERİ ---
@app.post("/register", status_code=201)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user: raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")
    hashed_password = pwd_context.hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, name=user.name, surname=user.surname)
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"message": f"Kullanıcı '{user.email}' başarıyla oluşturuldu."}

@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")
    return {"message": "Giriş başarılı!", "user_id": db_user.id, "user_name": db_user.name}

@app.post("/evaluate_hcc_risk")
async def evaluate_hcc_risk(
    user_id: int = Form(...),
    patient_name: str = Form(...),
    patient_surname: str = Form(...),
    patient_tc: str = Form(...),
    lab_data: str = Form(...),
    doctor_name: str = Form(...),
    usg_file: Optional[UploadFile] = File(None),
    mri_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    afp_value: Optional[float] = Form(None),
    alcohol_consumption: Optional[str] = Form(None),
    smoking_status: Optional[str] = Form(None),
    hcv_status: Optional[str] = Form(None),
    hbv_status: Optional[str] = Form(None),
    cancer_history_status: Optional[str] = Form(None),
    pst_score: Optional[int] = Form(0),
    doctor_note: Optional[str] = Form(None),
    usg_result_json: Optional[str] = Form(None),
    mri_analysis_json: Optional[str] = Form(None)
):
    if not patient_tc or not patient_tc.strip():
        raise HTTPException(status_code=400, detail="TC Kimlik Numarası zorunludur.")

    lab_result, usg_result, mri_analysis_result = {}, {}, {}
    vlm_report_data, comprehensive_report_data = {}, {}
    
    try:
        lab_data_dict = json.loads(lab_data)
        lab_data_pydantic = LabData(**lab_data_dict)
        lab_result = await predict_lab_risk(lab_data_pydantic)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lab verisi hatası: {e}")

    # Eğer USG dosyası yüklendiyse: CNN + VLM çalıştır
    if usg_file and usg_file.filename:
        contents = await usg_file.read()
        usg_result = {}
        
        # 1. Yerel CNN Modeli (VGG16) Analizi
        try:
            usg_result = await predict_usg_fibrosis(contents)
        except Exception as e:
            print(f"USG CNN modeli işleme hatası: {e}")
            usg_result = {"error": "USG analiz modeli yüklenmedi veya işlenemedi.", "stage_label": "Bilinmiyor (CNN Hatası)"}
            
        # 2. VLM (Görsel Dil Modeli - Gemini) Analizi
        try:
            vlm_report_data = await generate_radiology_report_vlm(contents, usg_result.get('stage_label', 'Bilinmiyor'), doctor_name)
        except Exception as e:
            print(f"VLM dosyası işleme hatası: {e}")
            vlm_report_data = {"text": "VLM destekli görüntü analizi yapılamadı.", "model_used": "N/A"}

    if mri_file and mri_file.filename:
        try:
            mri_contents = await mri_file.read()
            mri_analysis_result = await predict_mri_analysis(mri_contents, mri_file.filename, pst_score=pst_score)
        except Exception as e:
            print(f"MRI dosyası işleme hatası: {e}")
            mri_analysis_result = {"error": "MRI dosyası işlenemedi."}

    # Dosya yüklenmemişse ama ilk çağrıdan JSON sonuç geldiyse, onu kullan (LLMRaporu ikinci çağrısı)
    if not usg_result and usg_result_json:
        try:
            usg_result = json.loads(usg_result_json)
            print(f"📋 USG sonucu JSON'dan alındı: {usg_result}")
        except: pass
    if not mri_analysis_result and mri_analysis_json:
        try:
            mri_analysis_result = json.loads(mri_analysis_json)
            print(f"📋 MRI sonucu JSON'dan alındı: {mri_analysis_result}")
        except: pass

    comprehensive_context = {
        "patient_details": {
            "age": lab_data_dict.get('Yaş'),
            "gender": "Erkek" if lab_data_dict.get('Cinsiyet') == 1 else "Kadın",
            "alcohol_consumption": alcohol_consumption, "smoking_status": smoking_status,
            "hcv_status": hcv_status, "hbv_status": hbv_status,
            "cancer_history_status": cancer_history_status, "afp_value": afp_value
        },
        "lab_result": lab_result, "usg_result": usg_result,
        "mri_analysis": mri_analysis_result, "doctor_note": doctor_note
    }
    
    comprehensive_report_data = await generate_comprehensive_report(comprehensive_context, doctor_name)
    
    # --- GERİ ALINDI: Orijinal veritabanı kayıt mantığı ---
    try:
        patient_to_use = db.query(Patient).filter(Patient.tc == patient_tc.strip()).first()
        if not patient_to_use:
            patient_to_use = Patient(
                tc=patient_tc.strip(), name=patient_name, surname=patient_surname,
                age=lab_data_dict.get('Yaş'),
                gender="Erkek" if lab_data_dict.get('Cinsiyet') == 1 else "Kadın",
                user_id=user_id
            )
            db.add(patient_to_use)
            db.commit()
            db.refresh(patient_to_use)
        
        # Orijinal, tek parça JSON objesi oluşturuluyor
        db_data_to_save = {
            "lab_data": lab_data_dict, "afp_value": afp_value,
            "risk_factors": {"alcohol": alcohol_consumption, "smoking": smoking_status, "hcv": hcv_status, "hbv": hbv_status, "cancer_history": cancer_history_status},
            "usg_report_vlm": vlm_report_data.get("text"),
            "mri_analysis_summary": mri_analysis_result,
            "comprehensive_report": comprehensive_report_data.get("text"),
            "vlm_model_used": vlm_report_data.get("model_used"),
            "comprehensive_model_used": comprehensive_report_data.get("model_used"),
            "doctor_note": doctor_note
        }
        
        new_evaluation = Evaluation(
            patient_id=patient_to_use.id,
            evaluation_date=datetime.utcnow(),
            patient_details_json=json.dumps(db_data_to_save),
            api_result_json=json.dumps(db_data_to_save) # Her iki sütuna da aynı veri kaydediliyor
        )
        db.add(new_evaluation)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Veritabanı Kayıt Hatası: {e}")

    # --- KAPSAMLI RİSK HESAPLAMA ---
    overall_risk = calculate_comprehensive_risk(
        lab_risk_level=lab_result.get("risk_level", "Düşük Risk"),
        usg_stage=usg_result.get("stage_label", ""),
        mri_stage=mri_analysis_result.get("stage", ""),
        afp=afp_value or 0.0,
        hbv=hbv_status,
        hcv=hcv_status,
        cancer_history=cancer_history_status
    )

    return {
        "overall_risk_level": overall_risk,
        "lab_result": lab_result,
        "usg_result": usg_result,
        "mri_analysis": mri_analysis_result,
        "vlm_radiology_report": vlm_report_data.get("text"),
        "vlm_model_used": vlm_report_data.get("model_used"),
        "comprehensive_report": comprehensive_report_data.get("text"),
        "comprehensive_model_used": comprehensive_report_data.get("model_used"),
        "doctor_note": doctor_note or "",
    }

# --- ÇALIŞTIRMA BLOĞU ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 