# 🔬 HCCentinel: Gelişmiş HCC Erken Teşhis Sistemi

![HCCentinel Banner](https://img.shields.io/badge/AI-Diagnostics-blueviolet?style=for-the-badge&logo=ai)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![TensorFlow](https://img.shields.io/badge/AI-TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow)

**HCCentinel**, karaciğer kanserinin (Hepatosellüler Karsinom - HCC) erken teşhisi için tasarlanmış, multimodal (çok modlu) yapay zeka destekli bir klinik karar destek sistemidir. Sistem, laboratuvar verileri, demografik bilgiler ve radyolojik görüntüleri (USG & MRI) birleştirerek kapsamlı analizler sunar.

---

## ✨ Temel Özellikler

- 🧬 **Multimodal Analiz:** Laboratuvar bulguları ve tıbbi görüntüleri eş zamanlı işleme.
- 🖼️ **VLM Radyoloji Raporlama:** Ultrason görüntülerini **Gemini 2.0 Flash** (Vision) ile analiz ederek otomatik tıbbi rapor üretimi.
- 🤖 **Hibrit AI Modelleri:** 
  - **XGBoost:** Lab verileriyle hastalık ve risk tahmini (%33, %66 risk skalası).
  - **VGG16 (CNN):** USG üzerinden fibrozis evreleme.
  - **TensorFlow/Keras:** MRI üzerinden tümör segmentasyonu ve evre analizi.
- 👨‍⚕️ **Doktor-LLM Eşleşmesi:** Farklı doktor profilleri için özelleştirilmiş LLM servisleri (Gemini, Groq/Llama 3, DeepSeek/OpenRouter).
- 📄 **Akıllı Raporlama:** Tüm analizlerin sentezlendiği indirilebilir PDF klinik raporlar.

---

## 🛠️ Teknoloji Yığını

### **Frontend**
- **Framework:** React.js
- **Styling:** Vanilla CSS, FontAwesome Icons
- **Utility:** JSPDF & HTML2Canvas (Rapor Dışa Aktarma)

### **Backend**
- **Framework:** FastAPI (Python 3.13+)
- **ORM:** SQLAlchemy (SQLite Veritabanı)
- **Modeller:** TensorFlow, Keras, XGBoost, Joblib, Nibabel (MRI/NIfTI)

### **AI & LLM Servisleri**
- **Google AI:** Gemini 1.5 Flash & 2.0 Flash
- **Groq:** Llama 3 (70B & 8B)
- **OpenRouter:** DeepSeek Chat

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/zeynep-tkn/HCCentinel.git
cd HCCentinel
```

### 2. Backend Kurulumu (Python)
```bash
cd HCC_web_design-API
pip install -r requirements.txt
```
**API Anahtarları:** `api_keys.txt` dosyasını oluşturun ve anahtarlarınızı ekleyin:
```text
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
```

### 3. Frontend Kurulumu (React)
```bash
cd ../HCC_web_design
npm install
npm start
```

---

## 📂 Proje Yapısı

```text
HCCentinel/
├── HCC_web_design/           # React Frontend Uygulaması
│   ├── src/components/       # UI Bileşenleri (Dashboard, Rapor, Login)
│   └── public/              # Statik Varlıklar
├── HCC_web_design-API/       # FastAPI Backend Uygulaması
│   ├── main.py              # API Endpoint'leri ve İş Mantığı
│   ├── llm_services.py      # LLM Entegrasyonları (Gemini, Groq, DeepSeek)
│   ├── database.py          # Veritabanı Modelleri
│   └── *.h5 / *.joblib      # Eğitilmiş Yapay Zeka Modelleri
└── PROJECT_INFO.md          # Proje Özeti
```

---

## ⚠️ Önemli Notlar
- `fibroz_vgg16_model.h5` dosyası 100MB limitini aştığı için GitHub'a yüklenememiştir. Projeyi tam kapasite çalıştırmak için bu model dosyasını yerel dizine manuel eklemeniz gerekmektedir.
- Sistem tıbbi bir karar destek aracıdır; nihai teşhis her zaman bir uzman hekim tarafından konulmalıdır.

---

## 📄 Lisans
Bu proje eğitim ve araştırma amaçlı geliştirilmiştir.

---
⭐ *Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!*
