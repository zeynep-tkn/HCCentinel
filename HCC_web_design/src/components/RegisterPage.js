import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; 
import logo from '../assets/HCCentinel.png'; 
import Modal from './Modal';

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

      <form className="login-box" onSubmit={handleRegister}>
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
        </div>

        <div className="button-wrapper">
          <button type="submit">Hesap Oluştur</button>
        </div>

        <div className="login-footer">
          <p className="register-link">
            Zaten hesabınız var mı?{' '}
            <span onClick={() => navigate('/')} style={{cursor: 'pointer', color: '#004cff'}}>Giriş yap</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
