📄 Proje Tanıtım ve İçerik Dokümanı

Gelişmiş HCC Erken Teşhis Sistemi
Bu proje, karaciğer kanserinin (HCC) erken teşhisi için tasarlanmış, yapay zeka destekli bir karar destek sistemidir. Doktorların hasta verilerini (laboratuvar bulguları, demografik bilgiler) ve tıbbi görüntülerini (Ultrasound, MRI) tek bir platformda analiz etmelerine olanak tanır.

🏗️ Proje Mimarisi
1. Backend (HCC_web_design-API)
Projenin beyni olan bu bölüm, karmaşık yapay zeka modellerini ve veri yönetimini üstlenir.

Teknoloji: FastAPI (Python), SQLAlchemy (SQLite).
Yapay Zeka Modelleri:
XGBoost: Laboratuvar sonuçlarını analiz ederek HCC riskini tahmin eder.
VGG16 (CNN): Ultrason (USG) görüntülerinden fibroz evresini belirler.
MRI Analiz Modeli: MRI görüntülerinden tümör segmentasyonu ve evreleme yapar.
Geniş Dil Modeli (LLM) Entegrasyonu: Google Gemini, Groq (Llama 3) ve DeepSeek kullanarak tıbbi verileri sentezler ve doktorlar için otomatik, detaylı raporlar üretir.
2. Frontend (HCC_web_design)
Kullanıcı dostu arayüzü ile doktorların tüm süreci yönetmesini sağlar.

Teknoloji: React.js, React Router, FontAwesome.
Özellikler:
Kullanıcı (Doktor) kayıt ve giriş sistemi.
Hasta kayıt ve geçmiş yönetimi.
Veri giriş formları (Laboratuvar sonuçları, risk faktörleri).
Görüntü yükleme alanı (USG ve MRI dosyaları için).
Raporlama: Analiz sonuçlarını PDF formatında dışa aktarma (jspdf & html2canvas).
📊 Öne Çıkan Özellikler
Multimodal Analiz: Sadece sayılarla değil, görüntülerle de analiz yaparak daha doğru bir teşhis imkanı sunar.
Doktor-Model Eşleşmesi: Farklı doktorlar için farklı LLM modellerinin (Gemini, DeepSeek vb.) atanabildiği özel bir yapı mevcuttur.
VLM (Vision Language Model): Ultrason görüntülerini doğrudan analiz edip tıbbi dille raporlayan görüntü işleme yeteneği.