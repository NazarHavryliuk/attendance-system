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

  const photoPanel = (
    <article className="card profile-card">
      <h3>Фото профілю</h3>
      <div className="profile-avatar-wrap">
        {currentPhoto
          ? <img src={currentPhoto} alt="avatar" className="profile-avatar" />
          : <div className="profile-avatar-empty">👤</div>
        }
      </div>
      <div className="profile-controls">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} />
        <button type="button" onClick={uploadPhoto}>Зберегти фото</button>
      </div>
    </article>
  );

  const passwordPanel = (
    <article className="card profile-card">
      <h3>Безпека</h3>
      <form className="profile-password-form" onSubmit={submit}>
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
        <button type="submit">Оновити пароль</button>
      </form>
    </article>
  );

  return (
    <section className="page">
      <h2 className="profile-title">Мій профіль</h2>
      <div className="profile-grid">
        {photoPanel}
        {passwordPanel}
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
};

export default Profile;

