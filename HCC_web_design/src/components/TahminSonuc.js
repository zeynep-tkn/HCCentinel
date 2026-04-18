import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaImage, FaPaperPlane, FaRobot, FaUserMd, FaUserPlus } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import LLMModelComparison from "./LLMModelComparison";
import "./TahminSonuc.css";

// YENİ: Gerekli ikonları import ediyoruz
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// --- YENİ BÖLÜM: Rehber Kutucuğu Component'i ---
const TourBox = ({ title, content, isVisible, onNext, onPrev, onClose, isFirst, isLast }) => {
  if (!isVisible) return null;
  return (
    <div className="tour-box">
      <div className="tour-box-title">{title}</div>
      <div className="tour-box-content">{content}</div>
      <div className="tour-navigation">
        {isFirst ? <button onClick={onClose} className="tour-button secondary">Kapat</button> : <button onClick={onPrev} className="tour-button secondary">Geri</button>}
        {isLast ? <button onClick={onClose} className="tour-button">Bitir</button> : <button onClick={onNext} className="tour-button">İleri</button>}
      </div>
    </div>
  );
};
// --- YENİ BÖLÜM SONU ---

// --- YENİ BÖLÜM: Bu sayfanın rehber adımları ---
const tahminSonucTourSteps = [
    { title: "1. Hasta Bilgisi", content: "Bu kart, değerlendirmesi yapılan hastanın temel demografik bilgilerini özetler." },
    { title: "2. Genel Risk Seviyesi", content: "Hastanın laboratuvar verilerine dayanarak hesaplanan genel HCC risk seviyesini gösterir." },
    { title: "3. Yapay Zekâ Değerlendirmesi", content: "Farklı yapay zekâ modellerinin hasta verilerine dayanarak yaptığı detaylı analiz ve risk tahminlerini içerir." },
    { title: "4. Görüntü Analizi (VLM)", content: "Yüklenen ultrason veya MR görüntüsünün, görsel dil modeli (VLM) tarafından analiz edilerek oluşturulan radyoloji raporunu gösterir." },
    { title: "5. Doktor Geri Bildirimi", content: "AI tarafından oluşturulan sonuçları değerlendirip kendi yorumlarınızı ekleyebileceğiniz alandır." }
];
// --- YENİ BÖLÜM SONU ---


const TahminSonuc = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [doktorYorumu, setDoktorYorumu] = useState("");

  const { hastaAdiSoyadi, apiResult, patientDetails, vlmReport } = location.state || {};

  // --- YENİ BÖLÜM: Rehber mantığı ---
  const [tourStep, setTourStep] = useState(0);
  const totalSteps = tahminSonucTourSteps.length;
  const tourIconRef = useRef(null);
  const pageRef = useRef(null);

  const startTour = () => setTourStep(1);
  const endTour = () => setTourStep(0);
  const nextStep = () => setTourStep(current => (current < totalSteps ? current + 1 : 0));
  const prevStep = () => setTourStep(current => (current > 1 ? current - 1 : 0));

  useEffect(() => {
    if (tourStep === 0) return;
    function handleClickOutside(event) {
      if (
        pageRef.current && !pageRef.current.contains(event.target) && 
        tourIconRef.current && !tourIconRef.current.contains(event.target) &&
        !event.target.closest('.tour-box')
      ) {
        endTour();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tourStep]);
  // --- YENİ BÖLÜM SONU ---


  const handleYeniHasta = () => {
    localStorage.removeItem("hastaFormData");
    navigate("/input");
  };

  useEffect(() => {
    console.log("VLM Report (ilk 100 karakter):", vlmReport?.substring(0, 100) || "Yok");
  }, [vlmReport]);

  if (!apiResult || !hastaAdiSoyadi) {
    return (
      <div className="tahmin-container">
        <h2 className="baslik">Sonuç Bulunamadı</h2>
        <p>Lütfen tahmin yapmak için ana sayfaya geri dönün.</p>
        <button className="calculate-btn" onClick={() => navigate("/")}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const overallRisk = apiResult?.overall_risk_level || "Belirlenemedi";
  
  let riskBoxClass = "risk-kutusu";
  if (overallRisk.includes("Düşük Risk")) riskBoxClass += " risk-dusuk";
  else if (overallRisk.includes("Orta Risk")) riskBoxClass += " risk-orta";
  else if (overallRisk.includes("Yüksek Risk")) riskBoxClass += " risk-yuksek";

  const veriListesi = [];
  if (patientDetails.age) veriListesi.push("yaş");
  if (patientDetails.gender) veriListesi.push("cinsiyet");
  if (patientDetails.afp) veriListesi.push("AFP");
  if (patientDetails.ALT) veriListesi.push("ALT");
  if (patientDetails.AST) veriListesi.push("AST");
  if (patientDetails.ALP) veriListesi.push("ALP");
  if (patientDetails.BIL) veriListesi.push("Bilirubin");
  if (patientDetails.GGT) veriListesi.push("GGT");
  if (patientDetails.Albumin) veriListesi.push("Albumin");
  if (patientDetails.ultrasonFileUploaded) veriListesi.push("Ultrason görüntüsü");
  if (patientDetails.btFileUploaded) veriListesi.push("MR görüntüsü");

  const son = veriListesi.pop();
  const riskNotu = son
    ? `Not: Bu risk seviyesi ${veriListesi.length > 0 ? veriListesi.join(", ") + " ve " : ""}${son} verilerine göre hesaplanmıştır.`
    : "Not: Risk hesaplaması için yeterli veri sağlanmamıştır.";

  return (
    <div className="tahmin-container" id="tahmin-container" ref={pageRef}>
      
      {/* YENİ: Ampul ikonu eklendi */}
      <button ref={tourIconRef} onClick={startTour} className="info-icon-button" title="Rehberi Başlat">
        <FontAwesomeIcon icon={faLightbulb} size="2x" />
      </button>

      <button className="yeni-hasta-buton" onClick={handleYeniHasta}>
        <FaUserPlus className="yeni-hasta-ikon" />
        <span className="yeni-hasta-tooltip">Yeni Hasta Ekle</span>
      </button>

      <div className="nav-buttons-inside">
        <button className="nav-btn" onClick={() => navigate("/input")}>
          <FaArrowLeft className="nav-icon" />
        </button>
        <button className="nav-btn" onClick={() => navigate("/")}>
          <FaArrowRight className="nav-icon" />
        </button>
      </div>

      <h2 className="baslik">AI Destekli Değerlendirme Sonucu</h2>

      <div className="kart hasta-kart">
        {tourStep === 1 && (
            <TourBox 
                title={tahminSonucTourSteps[0].title}
                content={tahminSonucTourSteps[0].content}
                isVisible={tourStep === 1}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={endTour}
                isFirst={true}
            />
        )}
        <h3><FaUserMd className="ikon-kucuk" /> Hasta Bilgisi</h3>
        <p><strong>Ad:</strong> {patientDetails?.name || "-"}</p>
        <p><strong>Soyad:</strong> {patientDetails?.surname || "-"}</p>
        <p><strong>Yaş:</strong> {patientDetails?.age || "-"}</p>
        <p><strong>Cinsiyet:</strong> {patientDetails?.gender || "-"}</p>
      </div>

      <div className="kart risk-kart">
        {tourStep === 2 && (
            <TourBox 
                title={tahminSonucTourSteps[1].title}
                content={tahminSonucTourSteps[1].content}
                isVisible={tourStep === 2}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={endTour}
            />
        )}
        <h3 className="kart-baslik">Genel HCC Risk Seviyesi</h3>
        <div className="risk-icerik">
          <span className={riskBoxClass}>{overallRisk.replace(/ \(.*\)/, '')}</span>
          <p className="risk-not">{riskNotu}</p>
        </div>
      </div>

      <div className="llm-kart">
        {tourStep === 3 && (
            <TourBox 
                title={tahminSonucTourSteps[2].title}
                content={tahminSonucTourSteps[2].content}
                isVisible={tourStep === 3}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={endTour}
            />
        )}
        <div className="llm-header">
          <h3><FaRobot /> Yapay Zekâ Değerlendirmesi</h3>
        </div>
        <LLMModelComparison 
          patientDetails={patientDetails} 
          apiResult={apiResult} 
        />
      </div>

      <div className="kart usg-goruntu-kart">
        {tourStep === 4 && (
            <TourBox 
                title={tahminSonucTourSteps[3].title}
                content={tahminSonucTourSteps[3].content}
                isVisible={tourStep === 4}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={endTour}
            />
        )}
        <h3><FaImage className="ikon" /> Görüntü Analizi (VLM Destekli)</h3>
        <div className="usg-icerik-grid">
          <div className="usg-goruntu-alani">
            {patientDetails?.ultrasonImageUrl?.startsWith("blob:") ? (
              <img src={patientDetails.ultrasonImageUrl} alt="USG Görüntüsü" className="usg-image-preview" />
            ) : patientDetails?.btImageUrl?.startsWith("blob:") ? (
              <img src={patientDetails.btImageUrl} alt="BT Görüntüsü" className="usg-image-preview" />
            ) : (
              <div className="usg-image-placeholder">Görüntü yüklenmedi.</div>
            )}
          </div>
          <div className="vlm-yorum-alani">
            {vlmReport ? (
              <div
                className="vlm-report-content"
                dangerouslySetInnerHTML={{ __html: vlmReport }}
              />
            ) : (
              <p className="usg-placeholder">VLM raporu oluşturulmadı.</p>
            )}
          </div>
        </div>
      </div>

      <div className="kart doktor-yorum-kapsayici">
        {tourStep === 5 && (
            <TourBox 
                title={tahminSonucTourSteps[4].title}
                content={tahminSonucTourSteps[4].content}
                isVisible={tourStep === 5}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={endTour}
                isLast={true}
            />
        )}
        <h3><FaUserMd /> Doktor Geri Bildirimi</h3>
        <div className="doktor-yorum-wrapper">
          <textarea
            className="doktor-textarea"
            placeholder="Doktor yorumunu buraya yazabilir..."
            value={doktorYorumu}
            onChange={(e) => setDoktorYorumu(e.target.value)}
          />
          <button
            className="ikon-gonder-btn"
            onClick={() => alert("Yorumladığınız için teşekkür ederiz.")}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TahminSonuc;
