import React from 'react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <section className="hero">
      <h1>Система обліку відвідуваності</h1>
      <p>Ви увійшли як: <strong>{user?.name}</strong> ({user?.role})</p>
      <p>Доступні функції відображаються за вашою роллю: admin, teacher або student.</p>
    </section>
  );
};

export default Home;
