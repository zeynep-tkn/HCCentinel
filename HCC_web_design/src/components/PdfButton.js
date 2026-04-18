import React from "react";
import { FaFilePdf } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PdfIndirButton = ({ elementId = "tahmin-container", hasta = "Bilinmiyor" }) => {
  const handleDownloadPDF = () => {
    const input = document.getElementById(elementId);
    if (!input) return alert("PDF içeriği bulunamadı!");

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HCC-Tahmin-${hasta}.pdf`);
    });
  };

  return (
    <button className="pdf-indir-btn" onClick={handleDownloadPDF}>
      <FaFilePdf style={{ marginRight: "6px" }} />
      PDF İndir
    </button>
  );
};

export default PdfIndirButton;