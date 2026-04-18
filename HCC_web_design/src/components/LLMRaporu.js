// src/components/LLMRaporu.js

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useEffect, useState } from 'react';
import { FaDownload, FaSpinner } from 'react-icons/fa';
import hccSentinelLogo from '../assets/HCCentinel.png';
import './LLMRaporu.css';

const LLMRaporu = () => {
  const [apiResult, setApiResult] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportDate, setReportDate] = useState('');

  useEffect(() => {
    const generateNewReport = async () => {
      try {
        const storedDataString = sessionStorage.getItem('reportDataForLlm');
        if (!storedDataString) throw new Error("Oturumda rapor verisi bulunamadı.");
        
        const storedData = JSON.parse(storedDataString);
        setPatientDetails(storedData.patientDetails);
        setSelectedDoctor(storedData.selectedDoctor);

        const payload = new FormData();
        const userId = localStorage.getItem("user_id");

        payload.append('user_id', userId);
        payload.append('patient_name', storedData.patientDetails.name);
        payload.append('patient_surname', storedData.patientDetails.surname);
        payload.append('patient_tc', storedData.patientDetails.tc);
        const labData = {
            Yaş: parseFloat(storedData.patientDetails.Yas), Cinsiyet: storedData.patientDetails.gender === "Erkek" ? 1 : 0,
            Albumin: parseFloat(storedData.patientDetails.Albumin || 0), ALP: parseFloat(storedData.patientDetails.ALP || 0),
            ALT: parseFloat(storedData.patientDetails.ALT || 0), AST: parseFloat(storedData.patientDetails.AST || 0),
            BIL: parseFloat(storedData.patientDetails.BIL || 0), GGT: parseFloat(storedData.patientDetails.GGT || 0),
        };
        payload.append('lab_data', JSON.stringify(labData));
        payload.append('doctor_name', storedData.selectedDoctor);
        payload.append("afp_value", parseFloat(storedData.patientDetails.AFP || 0));

        const response = await fetch("http://localhost:8000/evaluate_hcc_risk", { method: "POST", body: payload });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Sunucu hatası");
        }
        const result = await response.json();
        setApiResult(result);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    generateNewReport();
    
    const today = new Date();
    setReportDate(`${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`);
  }, []);
  
  const handleDownloadPdf = () => {
    const input = document.getElementById('rapor-icerigi');
    const downloadButton = document.querySelector('.download-pdf-button');
    if (downloadButton) downloadButton.style.display = 'none';
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210, pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight, position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        const fileName = `${patientDetails?.name}_${patientDetails?.surname}_HCC_Raporu.pdf`;
        pdf.save(fileName);
        if (downloadButton) downloadButton.style.display = 'block';
    });
  };

  const renderComprehensiveReport = () => {
    const reportText = apiResult?.comprehensive_report;
    if (!reportText) return <p>Yapay zeka değerlendirmesi bulunamadı.</p>;
    if (apiResult.error) return <p className="rapor-hata-mesaji">{reportText}</p>;
    return reportText.split('\n').map((line, index) => {
      line = line.trim();
      if (line.startsWith('**') && line.endsWith('**')) return <h4 key={index}>{line.replaceAll('**', '')}</h4>;
      if (line.startsWith('* ')) return <p key={index}><strong>{line.substring(2)}</strong></p>;
      return <p key={index}>{line || <br />}</p>;
    });
  };

  if (isLoading) {
    return <div className="llm-rapor-container loading"><FaSpinner className="spinner" /><p>Rapor, {selectedDoctor} modeli ile oluşturuluyor...</p></div>;
  }
  if (error) {
    return <div className="llm-rapor-container error"><p>Hata: {error}</p></div>;
  }
  if (!apiResult || !patientDetails) {
    return <div className="llm-rapor-container">Rapor verisi yüklenemedi.</div>;
  }

  const overallRisk = apiResult?.overall_risk_level || "Belirlenemedi";
  const isHighRisk = overallRisk.toLowerCase().includes('yüksek');

  return (
    <div className="llm-rapor-container" id="rapor-icerigi">
        <button className="download-pdf-button" onClick={handleDownloadPdf} title="Raporu PDF Olarak İndir">
            <FaDownload />
        </button>
        <div className="rapor-header">
            <img src={hccSentinelLogo} alt="Logo" className="rapor-logo" />
            <h1>YAPAY ZEKA DESTEKLİ HCC TAHMİN RAPORU</h1>
            <div className="rapor-tarih">{reportDate}</div>
        </div>
        <div className="rapor-body">
            <div className="hasta-bilgileri">
                <div className="info-item"><strong>Hasta:</strong> <span>{patientDetails?.name} {patientDetails?.surname}</span></div>
                <div className="info-item"><strong>Yaş:</strong> <span>{patientDetails?.age}</span></div>
                <div className="info-item"><strong>Cinsiyet:</strong> <span>{patientDetails?.gender}</span></div>
                <div className="info-item"><strong>Genel Risk:</strong> <span className={isHighRisk ? 'risk-kalin' : ''}>{overallRisk}</span></div>
            </div>
            <div className="llm-sonuclari">
                {renderComprehensiveReport()}
            </div>
        </div>
        <div className="rapor-doktor-footer">
            <p><strong>Raporu Yorumlayan Model:</strong> {apiResult.comprehensive_model_used || "Bilinmiyor"}</p>
            <p><i>(Bu rapor yapay zeka tarafından oluşturulmuştur. Kesin sonuçlar için lütfen bir uzman ile görüşün.)</i></p>
        </div>
    </div>
  );
};

export default LLMRaporu;