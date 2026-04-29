import React, { useRef, useState } from 'react';
import { authApi, uploadApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Пароль оновлено');
    } catch (e2) {
      setError(e2.response?.data?.message || 'Не вдалося змінити пароль');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    const file = fileRef.current?.files[0];
    if (!file || !user?.id) return;
    setError('');
    setMessage('');
    try {
      await uploadApi.userPhoto(user.id, file);
      setMessage('Фото оновлено');
      setPhotoPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      await refreshProfile();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Не вдалося завантажити фото');
    }
  };

  const currentPhoto = photoPreview || user?.photo_url;

  return (
    <section className="page">
      <h2>Мій профіль</h2>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          {currentPhoto
            ? <img src={currentPhoto} alt="avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            : <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👤</div>
          }
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} />
          <button onClick={uploadPhoto}>Зберегти фото</button>
        </div>
      </div>

      <form className="card auth-box" onSubmit={submit}>
        <input
          type="password"
          placeholder="Поточний пароль"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Новий пароль (мін. 6 символів)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit">Оновити пароль</button>
      </form>
    </section>
  );
};

export default Profile;

