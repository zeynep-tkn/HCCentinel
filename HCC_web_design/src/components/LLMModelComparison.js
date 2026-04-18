import { useState } from "react";
import "./TahminSonuc.css";
import { FaFileAlt } from "react-icons/fa";

const modelSummaries = {
  "Dr. Ayşe": "Görüntü analizine dayalı düşük risk tahmini sunar. (gemini-flash)",
  "Dr. Can": "Laboratuvar verilerine göre değerlendirme yapan modeldir. (gemini-pro)",
  "Dr. Elif": "Hibrit sistem: klinik + görüntüleme ile entegre analiz yapar. (groq-llama3-70b)",
  "Dr. Murat": "Gelişmiş derin öğrenme modeli; çok yönlü analiz sağlar. (groq-llama3-8b)",
  "Dr. Zeynep": "Uzun vadeli hasta takibine odaklı yapay zekâ modelidir. (deepseek)",
};


// onDoctorSelect prop'u artık bu bileşen için GEREKLİ DEĞİL.
// Bu bileşen doğrudan sessionStorage'a yazıp raporu açıyor.
const LLMModelComparison = ({ patientDetails, apiResult }) => { 
  const [selectedModel, setSelectedModel] = useState("Dr. Ayşe"); // Başlangıçta Dr. Ayşe seçili

  const handleBoxClick = () => {
    // Verilerin gelip gelmediğini kontrol et
    if (!patientDetails || !apiResult) {
      alert("Rapor verisi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    // Yeni sekmeye aktarılacak verileri hazırla
    const reportData = {
      patientDetails,
      apiResult,
      selectedDoctor: selectedModel, // Seçilen doktor/model adını buraya ekliyoruz
      doctorSummary: modelSummaries[selectedModel], // Doktorun özetini de buraya ekliyoruz
    };

    // Veriyi tarayıcının oturum deposuna kaydet
    sessionStorage.setItem('reportDataForLlm', JSON.stringify(reportData));
    
    // Rapor sayfasını yeni bir sekmede aç
    window.open('/llmrapor', '_blank');
  };

  return (
    <div className="llm-yapay-kapsayici">
      <div className="llm-yatay-alan">
        <select
          className="doktor-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {Object.keys(modelSummaries).map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>

        <div className="doktor-ozet-kutu" onClick={handleBoxClick}>
  <FaFileAlt style={{ fontSize: "20px", marginRight: "8px", color: "#1e3a8a" }} />

  <strong>{selectedModel}:</strong> {modelSummaries[selectedModel]}
</div>


      </div>
    </div>
  );
};

export default LLMModelComparison;