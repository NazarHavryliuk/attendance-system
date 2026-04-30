import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = { admin: 'Адміністратор', teacher: 'Викладач', student: 'Студент' };

const features = [
  {
    icon: '📋',
    title: 'Заняття та сесії',
    desc: 'Викладач створює заняття, відкриває сесії і фіксує присутність студентів у реальному часі.',
  },
  {
    icon: '✅',
    title: 'Облік відвідуваності',
    desc: "Кожна позначка прив\u2019язана до конкретної сесії та дати, без дублікатів і плутанини.",
  },
  {
    icon: '📊',
    title: 'Звіти та статистика',
    desc: 'Детальні звіти по студентам, групам і заняттям із відсотком відвідуваності.',
  },
  {
    icon: '🖼️',
    title: 'Профілі з фото',
    desc: 'Кожен користувач може завантажити фото профілю, яке відображається скрізь у системі.',
  },
  {
    icon: '🔒',
    title: 'Розмежування ролей',
    desc: 'Три ролі — admin, teacher, student — з окремими правами доступу до кожного розділу.',
  },
  {
    icon: '🌙',
    title: 'Темна тема',
    desc: 'Перемикач теми зберігається між сесіями, інтерфейс комфортний вдень і вночі.',
  },
];

const roleLinks = {
  admin: [
    { to: '/admin', label: 'Панель керування' },
    { to: '/reports', label: 'Звіти' },
    { to: '/lessons', label: 'Заняття' },
  ],
  teacher: [
    { to: '/lessons', label: 'Заняття' },
    { to: '/reports', label: 'Звіти' },
    { to: '/profile', label: 'Профіль' },
  ],
  student: [
    { to: '/lessons', label: 'Мої заняття' },
    { to: '/reports', label: 'Мої звіти' },
    { to: '/profile', label: 'Профіль' },
  ],
};

const Home = () => {
  const { user } = useAuth();
  const links = roleLinks[user?.role] || [];

  return (
    <section className="hero home-page">
      <div className="home-hero-block">
        <div className="home-hero-badge">{ROLE_LABEL[user?.role] || user?.role}</div>
        <h1 className="home-hero-title">Система обліку відвідуваності</h1>
        <p className="home-hero-sub">
          Ви увійшли як: <strong>{user?.name}</strong> ({user?.role})<br />
          Цифрова система обліку відвідуваності для університету.
        </p>
        {links.length > 0 && (
          <div className="home-hero-links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="home-hero-link">{l.label}</NavLink>
            ))}
          </div>
        )}
      </div>

      <div className="home-features-grid">
        {features.map((f) => (
          <div key={f.title} className="home-feature-card card">
            <span className="home-feature-icon">{f.icon}</span>
            <h3 className="home-feature-title">{f.title}</h3>
            <p className="home-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Home;
