import { useCallback, useEffect, useState } from 'react';
import './Tour.css'; // Birazdan oluşturacağımız CSS dosyası

// Bilgi kutucuğunun kendisi
export const TourBox = ({ tourStep, onNext, onPrev, onClose }) => {
  if (!tourStep) return null;

  const { title, content, isFirst, isLast, type } = tourStep;
  const boxClass = type === 'button' ? 'tour-box for-button' : 'tour-box';

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

// Rehberin mantığını yöneten özel hook
export const useTour = (totalSteps) => {
  const [tourStepIndex, setTourStepIndex] = useState(-1); // -1: kapalı

  const startTour = () => setTourStepIndex(0);
  const endTour = useCallback(() => setTourStepIndex(-1), []);
  const nextStep = () => setTourStepIndex(current => (current < totalSteps - 1 ? current + 1 : -1));
  const prevStep = () => setTourStepIndex(current => (current > 0 ? current - 1 : -1));

  useEffect(() => {
    if (tourStepIndex === -1) return;

    function handleClickOutside(event) {
      // Tıklanan yerin rehber kutucuğu içinde olup olmadığını kontrol et
      if (event.target.closest('.tour-box')) return;
      
      // Eğer dışarı tıklandıysa turu kapat
      endTour();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tourStepIndex, endTour]);

  return {
    tourStepIndex,
    startTour,
    endTour,
    nextStep,
    prevStep,
  };
};
