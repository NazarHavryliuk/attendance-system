import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleItems = [
  { icon: '🛠️', title: 'Адміністратор', desc: 'Керує викладачами, студентами та групами.' },
  { icon: '📚', title: 'Викладач', desc: 'Проводить сесії занять і відмічає відвідуваність.' },
  { icon: '🎓', title: 'Студент', desc: 'Переглядає свої заняття, статистику та звіти.' },
];

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка авторизації');
    }
  };

  return (
    <section className="page login-page">
      <div className="login-layout">
        <article className="card login-info-card">
          <p className="login-kicker">Система обліку відвідуваності</p>
          <h2 className="login-title">Ласкаво просимо</h2>
          <p className="login-subtitle">
            Єдиний кабінет для адміністрування занять, фіксації присутності та формування звітів.
          </p>

          <div className="login-role-list">
            {roleItems.map((item) => (
              <div key={item.title} className="login-role-item">
                <span className="login-role-icon">{item.icon}</span>
                <div>
                  <p className="login-role-title">{item.title}</p>
                  <p className="login-role-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card login-form-card">
          <h3>Вхід у систему</h3>
          <form className="auth-box" onSubmit={submit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit">Увійти</button>
          </form>
       </article>
      </div>
    </section>
  );
};

export default Login;
