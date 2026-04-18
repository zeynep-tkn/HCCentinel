import { useEffect, useRef, useState } from 'react'; // useRef ve useEffect'i geri ekliyoruz
import { useNavigate } from 'react-router-dom';
import logo from '../assets/HCCentinel.png';
import './LoginPage.css';

import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Bilgi kutucuğu için özel bir component
const TourBox = ({ title, content, isVisible, onNext, onPrev, onClose, isFirst, isLast, type = 'input' }) => {
  if (!isVisible) return null;

  // Buton için farklı bir class atıyoruz
  const boxClass = type === 'button' ? 'tour-box for-button' : 'tour-box';

  return (
    <div className={boxClass}>
      <div className="tour-box-title">{title}</div>
      <div className="tour-box-content">{content}</div>
      <div className="tour-navigation">
        {isFirst ? <div></div> : <button onClick={onPrev} className="tour-button secondary">Geri</button>}
        {isLast ? <button onClick={onClose} className="tour-button">Bitir</button> : <button onClick={onNext} className="tour-button">İleri</button>}
      </div>
    </div>
  );
};


const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [tourStep, setTourStep] = useState(0);
  const totalSteps = 3;

  // --- YENİ BÖLÜM: Tıklamaları dinlemek için referanslar ---
  const tourIconRef = useRef(null);
  const formRef = useRef(null);
  // --- YENİ BÖLÜM SONU ---

  const startTour = () => setTourStep(1);
  const endTour = () => setTourStep(0);
  const nextStep = () => setTourStep(current => (current < totalSteps ? current + 1 : 0));
  const prevStep = () => setTourStep(current => (current > 1 ? current - 1 : 0));

  // --- YENİ BÖLÜM: Boşluğa tıklamayı dinleyen useEffect ---
  useEffect(() => {
    // Eğer tur kapalıysa, dinleyiciyi çalıştırma
    if (tourStep === 0) return;

    function handleClickOutside(event) {
      // Tıklanan yerin formun, ampul ikonunun veya rehber kutucuğunun dışında olup olmadığını kontrol et
      if (
        formRef.current && !formRef.current.contains(event.target) && 
        tourIconRef.current && !tourIconRef.current.contains(event.target) &&
        !event.target.closest('.tour-box')
      ) {
        endTour();
      }
    }

    // Dinleyiciyi ekle
    document.addEventListener("mousedown", handleClickOutside);
    // Component kaldırıldığında veya tur adımı değiştiğinde dinleyiciyi temizle
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tourStep]); // Bu effect sadece tur adımı değiştiğinde çalışır
  // --- YENİ BÖLÜM SONU ---

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Giriş sırasında bir hata oluştu.');
      }

      console.log('Giriş başarılı:', data);
      localStorage.removeItem("hastaFormData");
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.user_name);
      navigate('/input');

    } catch (err) {
      console.error('Giriş hatası:', err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      {/* ref'i butona ekliyoruz */}
      <button ref={tourIconRef} onClick={startTour} className="info-icon-button" title="Rehberi Başlat">
        <FontAwesomeIcon icon={faLightbulb} size="2x" />
      </button>

      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="HCCentinel Logo" className="login-logo" />
          <p className="welcome-text">Hoş geldiniz! Lütfen giriş yapın.</p>
        </div>

        {/* ref'i forma ekliyoruz */}
        <form ref={formRef} className="login-box" onSubmit={handleLogin}>
          {error && <p className="error-message">{error}</p>}
          
          <div className="input-wrapper">
            <input 
              type="email" 
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TourBox 
              title="1. E-posta Alanı" 
              content="Sisteme kayıtlı olduğunuz e-posta adresinizi buraya girin."
              isVisible={tourStep === 1}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
              isFirst={true}
            />
          </div>
          
          <div className="input-wrapper">
            <input 
              type="password" 
              placeholder="Şifre" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TourBox 
              title="2. Şifre Alanı" 
              content="Hesabınıza ait şifreyi bu alana giriniz."
              isVisible={tourStep === 2}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={endTour}
            />
          </div>

          <div className="button-wrapper">
            <button type="submit">Giriş Yap</button>
            <TourBox 
                title="3. Giriş Yap Butonu" 
                content="Bilgileri girdikten sonra sisteme giriş yapmak için tıklayın."
                isVisible={tourStep === 3}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={endTour}
                isLast={true}
                type="button" // Buton için özel tip
            />
          </div>
  
          <div className="login-footer">
            <p className="forgot-password">Şifrenizi mi unuttunuz?</p>
            <p className="register-link">
              Hesabınız yok mu?{' '}
              <span onClick={() => navigate('/register')} style={{cursor: 'pointer', color: '#007bff'}}>
                Hesap oluştur
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
