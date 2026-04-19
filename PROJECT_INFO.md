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





1. Genel HCC Risk Seviyesi (Düşük/Orta/Yüksek Risk)
Kullandığı Altyapı Model: XGBoost (Sayısal Karar Ağaçları / Makine Öğrenmesi Modeli)
Nereden Besleniyor? Yalnızca hastanın sayısal ve biyokimyasal tablosundan beslenir. Girdiğiniz kan sonuçları (ALT, AST, ALP, Albumin, Bilirubin, GGT vb.) ile Yaş, Cinsiyet gibi faktörleri alır.
Görevi Nedir? XGBoost, binlerce hastanın geçmiş kan verisiyle eğitilmiş matematiksel bir yapay zekadır. Resimden veya nottan anlamaz; sadece tahlil rakamlarına bakarak arka planda %31.64 gibi bir risk ihtimali hesaplar ve sizi "Düşük/Yüksek Risk" olarak uyarır.
2. Yapay Zekâ Değerlendirmesi (Dr. Zeynep, Dr. Ayşe vb.)
Kullandığı Altyapı Model: Geniş Dil Modelleri / LLM (Gemini, Llama 3, DeepSeek)
Nereden Besleniyor? Her şeyden! XGBoost'un çıkardığı risk skorunu, hastanın kan değerlerini, doktorun yazdığı manuel notu ve sistemde varsa çekilmiş USG/MR sonuçlarını tek bir potada eritir.
Görevi Nedir? Burası "Multidisipliner Kurul" görevini üstlenir. Doktor profillerine göre arka planda farklı beyinler çalışır (Örn: Zeynep = DeepSeek, Murat = Llama3). Az önce üzerine kurallar yazdığımız (Rapor PDF'i olarak indirdiğiniz) bütünsel sentez metinlerini bu modeller yazar. Sayısal risk ile manuel şüphenizi birleştiren zeka tam olarak budur.
3. Görüntü Analizi (VLM Destekli)
Kullandığı Altyapı Model: VGG16 (CNN - Evrişimli Sinir Ağı) ve Gemini-Pro Vision (VLM)
Nereden Besleniyor? Yalnızca sisteme yüklediğiniz USG (Ultrason) veya MRI görüntülerinden (piksellerden) beslenir. Kan tahliliyle işi yoktur.
Görevi Nedir? Tam bir "Yapay Zeka Radyoloğu" gibi çalışır. VGG16 (CNN) modeli, fotoğraftaki piksellere bakarak fibrozis (karaciğer sertleşmesi) evresini tahmin eder veya MR'da tümörün kenarlarını (segmentasyon) çizer. Görsel Dil Modeli (VLM) ise "Bu siyah beyaz fotoğrafta şunlar var" diyerek gördüğünü tıp diline döker.
Özetle Sistem Mimarisi:

Kan Tahlilleri için: XGBoost (Matematikçi)
Röntgen/Ultrasonlar için: VGG16 (CNN) (Radyolog)
Tüm bulguları okuyup final teşhis raporunu yazmak için: DeepSeek / Llama3 (Başhekim / Konsültasyon Başkanı) çalışıyor diyebiliriz.