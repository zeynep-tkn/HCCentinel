import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Stil için LoginPage.css'i kullanabiliriz
import logo from '../assets/HCCentinel.png'; 

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(''); // Hata mesajları için

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // handleRegister fonksiyonunu async yapıp API'ye istek gönderecek şekilde güncelledik
  const handleRegister = async (event) => {
    event.preventDefault(); // Formun default davranışını engelle
    setError(''); // Her denemede eski hatayı temizle

    // Şifre ve email kontrolü
    if (!form.email || !form.password) {
        setError('E-posta ve şifre alanları zorunludur.');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: form.name,
                surname: form.surname,
                email: form.email,
                password: form.password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // API'den gelen hata mesajını kullan
            throw new Error(data.detail || 'Kayıt sırasında bir hata oluştu.');
        }

        alert('Hesap başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        navigate('/'); // Başarılı kayıttan sonra giriş sayfasına yönlendir

    } catch (err) {
        console.error('Kayıt hatası:', err);
        setError(err.message); // Hata mesajını state'e ata
    }
  };

  return (
    <div className="login-container">
      <div className="login-header" style={{ marginTop: '30px', marginBottom: '10px' }}>
        <img src={logo} alt="Logo" style={{ width: '280px', marginBottom: '-5px' }} />
        <p className="welcome-text" style={{ margin: '10px 0 10px', fontSize: '18px' }}>
          Yeni bir hesap oluşturun
        </p>
      </div>

      {/* Form etiketini kullanmak daha doğru */}
      <form className="login-box" style={{ marginTop: '0px' }} onSubmit={handleRegister}>
        
        {/* HATA MESAJINI GÖSTERMEK İÇİN EKLENEN KISIM */}
        {error && <p className="error-message">{error}</p>}
        
        <input
          type="text"
          name="name"
          placeholder="Adınız"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="surname"
          placeholder="Soyadınız"
          value={form.surname}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Hesap Oluştur</button>

        <div className="login-footer">
          <p className="register-link">
            Zaten hesabınız var mı?{' '}
            <span onClick={() => navigate('/')} style={{cursor: 'pointer', color: '#007bff'}}>Giriş yap</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
