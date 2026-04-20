import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; 
import logo from '../assets/HCCentinel.png'; 
import Modal from './Modal';

import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TourBox = ({ title, content, isVisible, onNext, onPrev, onClose, isFirst, isLast, type = 'input' }) => {
  if (!isVisible) return null;
  const boxClass = type === 'button' ? 'tour-box for-button' : 'tour-box';
  return (
    <div className={boxClass}>
      <div className="tour-box-title">{title}</div>
      <div className="tour-box-content">{content}</div>
      <div className="tour-navigation">
        {isFirst ? <div></div> : <button type="button" onClick={onPrev} className="tour-button secondary">Geri</button>}
        {isLast ? <button type="button" onClick={onClose} className="tour-button">Bitir</button> : <button type="button" onClick={onNext} className="tour-button">İleri</button>}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const [tourStep, setTourStep] = useState(0);
  const totalSteps = 5;
  const tourIconRef = useRef(null);
  const formRef = useRef(null);

  const startTour = () => setTourStep(1);
  const endTour = () => setTourStep(0);
  const nextStep = () => setTourStep(current => (current < totalSteps ? current + 1 : 0));
  const prevStep = () => setTourStep(current => (current > 1 ? current - 1 : 0));

  useEffect(() => {
    if (tourStep === 0) return;
    function handleClickOutside(event) {
      if (
        formRef.current && !formRef.current.contains(event.target) && 
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

  const showModal = (title, message, type = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
        setError('E-posta ve şifre alanları zorunludur.');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name,
                surname: form.surname,
                email: form.email,
                password: form.password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Kayıt sırasında bir hata oluştu.');
        }

        showModal('Başarılı!', 'Hesap başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.', 'success');
        setTimeout(() => navigate('/'), 2000); 

    } catch (err) {
        console.error('Kayıt hatası:', err);
        setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <button type="button" ref={tourIconRef} onClick={startTour} className="info-icon-button" title="Rehberi Başlat">
        <FontAwesomeIcon icon={faLightbulb} size="2x" />
      </button>

      <div className="login-container">
      {/* MODAL BİLEŞENİ */}
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      <div className="login-header">
        <img src={logo} alt="Logo" className="login-logo" />
        <p className="welcome-text">Yeni bir hesap oluşturun</p>
      </div>

      <form ref={formRef} className="login-box" onSubmit={handleRegister}>
        {error && <p className="error-message">{error}</p>}
        
        <div className="input-wrapper">
          <input
            type="text"
            name="name"
            placeholder="Adınız"
            value={form.name}
            onChange={handleChange}
            required
          />
          <TourBox 
            title="1. Ad Alanı" 
            content="Lütfen adınızı buraya girin."
            isVisible={tourStep === 1}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
            isFirst={true}
          />
        </div>

        <div className="input-wrapper">
          <input
            type="text"
            name="surname"
            placeholder="Soyadınız"
            value={form.surname}
            onChange={handleChange}
            required
          />
          <TourBox 
            title="2. Soyad Alanı" 
            content="Lütfen soyadınızı buraya girin."
            isVisible={tourStep === 2}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
          />
        </div>

        <div className="input-wrapper">
          <input
            type="email"
            name="email"
            placeholder="E-posta"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TourBox 
            title="3. E-posta Alanı" 
            content="Giriş yaparken kullanacağınız aktif e-posta adresinizi girin."
            isVisible={tourStep === 3}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
          />
        </div>

        <div className="input-wrapper">
          <input
            type="password"
            name="password"
            placeholder="Şifre"
            value={form.password}
            onChange={handleChange}
            required
          />
          <TourBox 
            title="4. Şifre Alanı" 
            content="Güvenli bir şifre belirleyin."
            isVisible={tourStep === 4}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
          />
        </div>

        <div className="button-wrapper">
          <button type="submit">Hesap Oluştur</button>
          <TourBox 
            title="5. Kayıt Ol Butonu" 
            content="Bilgileri eksiksiz doldurduktan sonra hesabınızı oluşturmak için bu butona tıklayın."
            isVisible={tourStep === 5}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
            isLast={true}
            type="button"
          />
        </div>

        <div className="login-footer">
          <p className="register-link">
            Zaten hesabınız var mı?{' '}
            <span onClick={() => navigate('/')} style={{cursor: 'pointer', color: '#004cff'}}>Giriş yap</span>
          </p>
        </div>
      </form>
      </div>
    </div>
  );
};

export default RegisterPage;
