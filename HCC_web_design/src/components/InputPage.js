import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaUserMd } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./InputPage.css";

import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TourBox = ({ title, content, isVisible, onNext, onPrev, onClose, isFirst, isLast, type = 'input', className = '' }) => {
  if (!isVisible) return null;
  const boxClass = `${type === 'button' ? 'tour-box for-button' : 'tour-box'} ${className}`;
  return (
    <div className={boxClass}>
      <div className="tour-box-title">{title}</div>
      <div className="tour-box-content">{content}</div>
      <div className="tour-navigation">
        {isFirst ? <button onClick={onClose} className="tour-button secondary">Kapat</button> : <button onClick={onPrev} className="tour-button secondary">Geri</button>}
        {isLast ? <button onClick={onClose} className="tour-button">Bitir</button> : <button onClick={onNext} className="tour-button">İleri</button>}
      </div>
    </div>
  );
};


const LoadingOverlay = () => (
  <div className="loading-overlay">
    <div className="dna-spinner">
      {[...Array(15)].map((_, i) => (
        <div key={i} className="dna-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
      ))}
    </div>
    <p className="loading-text">Rapor Oluşturuluyor...</p>
  </div>
);

const styles = `
  .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(5px); }
  .loading-text { margin-top: 20px; font-size: 1.2rem; font-weight: 600; color: #333; }
  .dna-spinner { width: 40px; height: 120px; display: flex; justify-content: space-between; align-items: center; }
  .dna-bar { width: 4px; height: 100%; background-color: #3498db; animation: dna-wave 1.5s infinite ease-in-out; }
  @keyframes dna-wave { 0%, 100% { transform: scaleY(0.1); background-color: #3498db; } 50% { transform: scaleY(1); background-color: #e74c3c; } }
`;

const inputPageTourSteps = [
    { title: "1. Hasta Bilgileri", content: "Bu alana hastanın ad, soyad, TC kimlik no gibi temel demografik bilgilerini girin.", className: "" },
    { title: "2. Laboratuvar Sonuçları", content: "Hastanın kan tahlili sonuçlarını ilgili alanlara girin. Normal değer aralıkları referans olarak verilmiştir.", className: "right-col" },
    { title: "3. Görüntü Yükleme", content: "Ultrason ve MR görüntülerini bu alanlara sürükleyip bırakarak veya tıklayarak yükleyebilirsiniz.", className: "" },
    { title: "4. Doktor Notu", content: "Hasta ile ilgili özel gözlemlerinizi veya notlarınızı bu bölüme ekleyebilirsiniz.", className: "" },
    { title: "5. Hesapla Butonu", content: "Tüm verileri girdikten sonra, risk değerlendirmesini başlatmak için bu butona tıklayın.", type: 'button', className: "" }
];


const InputPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); 

  const [tourStep, setTourStep] = useState(0);
  const totalSteps = inputPageTourSteps.length;
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

  const getInitialForm = () => {
    const savedForm = localStorage.getItem("hastaFormData");
    return savedForm ? JSON.parse(savedForm) : {
      name: "", surname: "", tc: "", Yas: "", gender: "", alcohol: "",
      smoking: "", hcv: "", hbv: "", cancer_history: "", AFP: "",
      ALT: "", AST: "", ALP: "", BIL: "", GGT: "", Albumin: "",
      PST: "", doctor_note: "",
    };
  };

  const [form, setForm] = useState(getInitialForm);
  const [btFile, setBtFile] = useState(null);
  const [ultrasonFile, setUltrasonFile] = useState(null);
  const [btImageUrl, setBtImageUrl] = useState(null);
  const [ultrasonImageUrl, setUltrasonImageUrl] = useState(null);

  useEffect(() => {
    localStorage.setItem("hastaFormData", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Bu sayfayı görüntülemek için lütfen giriş yapın.");
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const is3DFile =
        fileName.endsWith(".nii") ||
        fileName.endsWith(".nii.gz") ||
        fileName.endsWith(".dcm");
      const previewUrl = is3DFile ? file.name : URL.createObjectURL(file);
      if (type === "bt") {
        setBtFile(file);
        setBtImageUrl(previewUrl);
      } else {
        setUltrasonFile(file);
        setUltrasonImageUrl(previewUrl);
      }
    } else {
      if (type === "bt") {
        setBtFile(null);
        setBtImageUrl(null);
      } else {
        setUltrasonFile(null);
        setUltrasonImageUrl(null);
      }
    }
  };

  const handleCalculate = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Lütfen tekrar giriş yapın.");
      navigate("/");
      return;
    }

    if (!form.name || !form.surname || !form.tc || !form.Yas || !form.gender) {
      alert("Lütfen hasta bilgilerini (Ad, Soyad, TC, Yaş, Cinsiyet) eksiksiz doldurun.");
      return;
    }

    setIsLoading(true);

    const labData = {
      Yaş: parseFloat(form.Yas), Cinsiyet: form.gender === "Erkek" ? 1 : 0,
      Albumin: parseFloat(form.Albumin || 0), ALP: parseFloat(form.ALP || 0),
      ALT: parseFloat(form.ALT || 0), AST: parseFloat(form.AST || 0),
      BIL: parseFloat(form.BIL || 0), GGT: parseFloat(form.GGT || 0),
      Albumin: parseFloat(form.Albumin || 0),
    };

    const payload = new FormData();
    payload.append("user_id", userId);
    payload.append("patient_name", form.name);
    payload.append("patient_surname", form.surname);
    payload.append("patient_tc", form.tc);
    payload.append("lab_data", JSON.stringify(labData));
    payload.append("afp_value", parseFloat(form.AFP || 0));
    payload.append("doctor_name", "Dr. Ayşe"); // İlk istek için varsayılan doktor
    payload.append("alcohol_consumption", form.alcohol || "");
    payload.append("smoking_status", form.smoking || "");
    payload.append("hcv_status", form.hcv || "");
    payload.append("hbv_status", form.hbv || "");
    payload.append("cancer_history_status", form.cancer_history || "");
    if (ultrasonFile) payload.append("usg_file", ultrasonFile);
    if (btFile) payload.append("mri_file", btFile);
    payload.append("pst", form.PST);

    try {
      const response = await fetch("http://localhost:8000/evaluate_hcc_risk", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Sunucu hatası");
      }

      const result = await response.json();
      const receivedVlmReport = result.vlm_radiology_report || null;

      navigate("/sonuc", {
        state: {
          hastaAdiSoyadi: `${form.name} ${form.surname}`,
          apiResult: result,
          vlmReport: receivedVlmReport,
          patientDetails: {
            ...form, age: form.Yas, ultrasonFileUploaded: !!ultrasonFile,
            btFileUploaded: !!btFile, ultrasonImageUrl, btImageUrl,
          },
        },
      });
    } catch (error) {
      console.error("Hesaplama hatası:", error);
      alert("Hesaplama sırasında hata oluştu: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const placeholderMap = {
    AFP: "Örn., 12 ng/mL (0-10)", ALT: "Örn., 35 U/L (7–40)",
    AST: "Örn., 30 U/L (5–40)", ALP: "Örn., 100 U/L (45–120)",
    GGT: "Örn., 50 U/L (9–48)", BIL: "Örn., 1.0 mg/dL (0.1–1.2)",
    Albumin: "Örn., 4.2 g/dL (3.5–5.0)",
  };

  return (
    <div className="input-page" ref={pageRef}>
      <style>{styles}</style>
      
      {isLoading && <LoadingOverlay />}

      <button ref={tourIconRef} onClick={startTour} className="info-icon-button" title="Rehberi Başlat">
        <FontAwesomeIcon icon={faLightbulb} size="2x" />
      </button>

      <div className="nav-buttons-inside">
        <button className="nav-btn" onClick={() => navigate("/")} disabled={isLoading}>
          <FaArrowLeft className="nav-icon" />
        </button>
        <button
          className="nav-btn"
          disabled={isLoading}
          onClick={() => {
            const apiResult = sessionStorage.getItem("apiResult");
            const vlmReport = sessionStorage.getItem("vlmReport");
            const patientDetails = sessionStorage.getItem("patientDetails");
            if (apiResult && vlmReport && patientDetails) {
              navigate("/sonuc");
            } else {
              alert("Henüz hesaplama yapılmadı. Lütfen önce 'Hesapla' butonuna basın.");
            }
          }}
        >
          <FaArrowRight className="nav-icon" />
        </button>
      </div>

      <h2>Hasta Bilgileri ve Laboratuvar Verileri</h2>

      <div className="left-section">
        {tourStep === 1 && (
            <TourBox 
              title={inputPageTourSteps[0].title}
              content={inputPageTourSteps[0].content}
              isVisible={tourStep === 1}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              isFirst={true}
              className={inputPageTourSteps[0].className}
            />
        )}
        <h3>Hasta Bilgileri</h3>
        <div className="hasta-grid-2col">
        {[
            { name: "name", label: "Ad", placeholder: "Örn., Ayşe" },
            { name: "surname", label: "Soyad", placeholder: "Örn., Yılmaz" },
            { name: "tc", label: "TC Kimlik No", placeholder: "Örn., 12345678901" },
            { name: "Yas", label: "Yaş", placeholder: "Örn., 45" },
        ].map(({ name, label, placeholder }) => (
            <div className="form-group" key={name}>
              <label>{label}</label>
              <input type="text" name={name} value={form[name]} placeholder={placeholder} onChange={handleChange} className={`form-control ${form[name] ? "input-filled" : ""}`} />
            </div>
        ))}
        <div className="form-group">
            <label>Cinsiyet</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={`form-control ${form.gender ? "input-filled" : ""}`}>
              <option value="">Seçiniz</option>
              <option value="Kadın">Kadın</option>
              <option value="Erkek">Erkek</option>
            </select>
        </div>
        {["alcohol", "smoking", "hcv", "hbv"].map((key) => (
            <div className="form-group" key={key}>
              <label>
              {
                  { alcohol: "Alkol Tüketimi", smoking: "Sigara Kullanımı", hcv: "HCV (Hepatit C)", hbv: "HBV (Hepatit B)" }[key]
              }
              </label>
              <select name={key} value={form[key]} onChange={handleChange} className={`form-control ${form[key] ? "input-filled" : ""}`}>
                  <option value="">Seçiniz</option>
                  <option value="Evet">Evet</option>
                  <option value="Hayır">Hayır</option>
              </select>
            </div>
        ))}
        <div className="form-group">
            <label>Ailede Kanser Öyküsü</label>
            <select name="cancer_history" value={form.cancer_history} onChange={handleChange} className={`form-control ${form.cancer_history ? "input-filled" : ""}`}>
                <option value="">Seçiniz</option>
                <option value="Var">Var</option>
                <option value="Yok">Yok</option>
            </select>
        </div>
        </div>
      </div>

      <div className="right-section">
        {tourStep === 2 && (
            <TourBox 
              title={inputPageTourSteps[1].title}
              content={inputPageTourSteps[1].content}
              isVisible={tourStep === 2}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              className={inputPageTourSteps[1].className}
            />
        )}
        <h3>Laboratuvar Sonuçları</h3>
        <div className="lab-grid">
        {["AFP", "ALT", "AST", "ALP", "GGT", "BIL", "Albumin"].map(
            (key, i) => (
              <div className="lab-item" key={i}>
              <label>{key}</label>
              <input type="text" name={key} value={form[key]} placeholder={placeholderMap[key]} onChange={handleChange} className={`form-control ${form[key] ? "input-filled" : ""}`} />
              </div>
            )
        )}
        <div className="lab-item">
            <label htmlFor="PST">PST (Performans Skoru)</label>
            <select id="PST" name="PST" value={form.PST} onChange={handleChange} className={`form-control ${form.PST ? "input-filled" : ""}`}>
                <option value="">Seçiniz</option>
                <option value="0">0 - Normal (aktif)</option>
                <option value="1">1 - Hafif aktivite kısıtlılığı</option>
                <option value="2">2 - Çalışamaz ama kendi bakımını yapabilir</option>
                <option value="3">3 - Günlük aktivite yapamaz</option>
                <option value="4">4 - Yatalak, tam bağımlı</option>
            </select>
        </div>
        </div>
      </div>

      <div className="image-section-wrapper">
        {tourStep === 3 && (
            <TourBox 
              title={inputPageTourSteps[2].title}
              content={inputPageTourSteps[2].content}
              isVisible={tourStep === 3}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              className={inputPageTourSteps[2].className}
            />
        )}
        {[
          { label: "Ultrason", file: ultrasonFile, url: ultrasonImageUrl, type: "ultrason", },
          { label: "MR", file: btFile, url: btImageUrl, type: "bt" },
        ].map(({ label, file, url, type }, i) => (
          <div className="bt-section" key={i}>
            <h3>{label} Görüntüsü Yükleme</h3>
            <label htmlFor={`${type}-upload`} className="upload-area">
                {url ? (
                  file.name.toLowerCase().match(/\.(nii|nii.gz|dcm)$/) ? (
                  <p>Yüklü: {url}</p>
                  ) : (
                  <img src={url} alt={`${label} Önizleme`} />
                  )
                ) : (
                  <div>
                  <strong>{label} Görüntüsü Yükle</strong>
                  <small>Sürükleyin veya gözatın</small>
                  </div>
                )}
            </label>
            <input type="file" id={`${type}-upload`} accept=".nii,.nii.gz,.dcm,image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, type)} />
          </div>
        ))}
      </div>

      <div className="doktor-note-kart">
        {tourStep === 4 && (
            <TourBox 
              title={inputPageTourSteps[3].title}
              content={inputPageTourSteps[3].content}
              isVisible={tourStep === 4}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              className={inputPageTourSteps[3].className}
            />
        )}
        <h3><FaUserMd /> Doktorun Notu</h3>
        <textarea name="doctor_note" value={form.doctor_note} onChange={handleChange} placeholder="Doktorun bu hasta için özel notu..." className="doktor-textarea" />
      </div>

      <div className="button-container">
        {tourStep === 5 && (
            <TourBox 
              title={inputPageTourSteps[4].title}
              content={inputPageTourSteps[4].content}
              isVisible={tourStep === 5}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              isLast={true}
              type="button"
              className={inputPageTourSteps[4].className}
            />
        )}
        <button className="calculate-btn" onClick={handleCalculate} disabled={isLoading}>
            Hesapla
        </button>
      </div>
    </div>
  );
};

export default InputPage;