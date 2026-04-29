import React, { useEffect, useState } from 'react';
import StudentList from '../components/StudentList';
import { groupsApi, studentsApi } from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', group_id: '' });
  const [error, setError] = useState('');

  const normalizedFilter = nameFilter.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (!normalizedFilter) return true;
    return (student.name || '').toLowerCase().includes(normalizedFilter);
  });

  const loadData = async () => {
    try {
      const [studentsRes, groupsRes] = await Promise.all([studentsApi.getAll(), groupsApi.getAll()]);
      setStudents(studentsRes.data.data || []);
      setGroups(groupsRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Помилка завантаження студентів');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await studentsApi.create(form);
      setForm({ name: '', email: '', password: '', group_id: '' });
      await loadData();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Не вдалося створити студента');
    }
  };

  const deleteStudent = async (id) => {
    try {
      await studentsApi.remove(id);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося видалити студента');
    }
  };

  return (
    <section className="page">
      <h2>Студенти (адмін)</h2>
      {error && <p className="error">{error}</p>}

      <form className="card" onSubmit={handleSubmit}>
        <h3>Створити студентський акаунт</h3>
        <div className="form-grid">
          <input
            placeholder="ПІБ"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            placeholder="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <select
            value={form.group_id}
            onChange={(e) => setForm({ ...form, group_id: e.target.value })}
            required
          >
            <option value="">Оберіть групу</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name} ({group.year} курс)
              </option>
            ))}
          </select>
          <button type="submit">Додати</button>
        </div>
      </form>

      <div className="card">
        <h3>Фільтр студентів</h3>
        <input
          type="text"
          placeholder="Пошук за ім'ям"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
      </div>

      <StudentList students={filteredStudents} onDelete={deleteStudent} />
    </section>
  );
};

export default Students;
