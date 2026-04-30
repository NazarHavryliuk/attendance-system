import React, { useRef, useEffect, useState } from 'react';
import { groupsApi, studentsApi, uploadApi, usersApi } from '../services/api';

const PhotoUploadCell = ({ currentUrl, onUpload }) => {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = ref.current?.files[0];
    if (!file) return;
    await onUpload(file);
    setPreview(null);
    if (ref.current) ref.current.value = '';
  };

  const src = preview || currentUrl;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {src
          ? <img src={src} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 20, lineHeight: 1 }}>👤</span>}
      </div>
    </div>
  );
};

const Admin = () => {
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' });
  const [groupForm, setGroupForm] = useState({ name: '', year: 1 });
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: '', group_id: '' });
  const [error, setError] = useState('');

  const normalizedSearch = studentSearch.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (!normalizedSearch) return true;
    return (student.name || '').toLowerCase().includes(normalizedSearch);
  });

  const normalizedTeacherSearch = teacherSearch.trim().toLowerCase();
  const filteredTeachers = teachers.filter((t) => {
    if (!normalizedTeacherSearch) return true;
    return (t.name || '').toLowerCase().includes(normalizedTeacherSearch) ||
           (t.email || '').toLowerCase().includes(normalizedTeacherSearch);
  });

  const normalizedGroupSearch = groupSearch.trim().toLowerCase();
  const filteredGroups = groups.filter((g) => {
    if (!normalizedGroupSearch) return true;
    return (g.name || '').toLowerCase().includes(normalizedGroupSearch);
  });

  const loadData = async () => {
    try {
      const [teacherRes, groupRes, studentRes] = await Promise.all([
        usersApi.getAll(),
        groupsApi.getAll(),
        studentsApi.getAll(),
      ]);
      setTeachers(teacherRes.data.data || []);
      setGroups(groupRes.data.data || []);
      setStudents(studentRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Помилка завантаження адмін-даних');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTeacher = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await usersApi.create(teacherForm);
      setTeacherForm({ name: '', email: '', password: '' });
      await loadData();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Не вдалося створити викладача');
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await usersApi.remove(id);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося видалити викладача');
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await groupsApi.create(groupForm);
      setGroupForm({ name: '', year: 1 });
      await loadData();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Не вдалося створити групу');
    }
  };

  const deleteGroup = async (id) => {
    try {
      await groupsApi.remove(id);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося видалити групу');
    }
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await studentsApi.create(studentForm);
      setStudentForm({ name: '', email: '', password: '', group_id: '' });
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

  const uploadTeacherPhoto = async (teacherId, file) => {
    try {
      await uploadApi.userPhoto(teacherId, file);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося завантажити фото');
    }
  };

  const uploadStudentPhoto = async (studentId, file) => {
    try {
      await uploadApi.studentPhoto(studentId, file);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося завантажити фото');
    }
  };

  return (
    <section className="page">
      <h2>Адмін-панель</h2>
      {error && <p className="error">{error}</p>}

      <form className="card" onSubmit={createTeacher}>
        <h3>Створити акаунт викладача</h3>
        <div className="form-grid">
          <input value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} placeholder="ПІБ" required />
          <input value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="Email" type="email" required />
          <input value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Пароль" type="password" required />
          <button type="submit">Створити викладача</button>
        </div>
      </form>

      <div className="card">
        <h3>Фільтр викладачів</h3>
        <input
          type="text"
          placeholder="Пошук за ім'ям або email"
          value={teacherSearch}
          onChange={(e) => setTeacherSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Фото</th>
              <th>Викладач</th>
              <th>Email</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher._id}>
                <td><PhotoUploadCell currentUrl={teacher.photo_url} onUpload={(file) => uploadTeacherPhoto(teacher._id, file)} /></td>
                <td>{teacher.name}</td>
                <td>{teacher.email}</td>
                <td><button className="danger" onClick={() => deleteTeacher(teacher._id)}>Видалити</button></td>
              </tr>
            ))}
            {filteredTeachers.length === 0 && (
              <tr><td colSpan={4}>Нічого не знайдено за цим фільтром</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={createGroup}>
        <h3>Створити групу</h3>
        <div className="form-grid">
          <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="Назва групи" required />
          <input value={groupForm.year} onChange={(e) => setGroupForm({ ...groupForm, year: Number(e.target.value) })} type="number" min="1" max="6" required />
          <button type="submit">Створити групу</button>
        </div>
      </form>

      <div className="card">
        <h3>Фільтр груп</h3>
        <input
          type="text"
          placeholder="Пошук за назвою групи"
          value={groupSearch}
          onChange={(e) => setGroupSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Група</th>
              <th>Курс</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <tr key={group._id}>
                <td>{group.name}</td>
                <td>{group.year}</td>
                <td><button className="danger" onClick={() => deleteGroup(group._id)}>Видалити</button></td>
              </tr>
            ))}
            {filteredGroups.length === 0 && (
              <tr><td colSpan={3}>Нічого не знайдено за цим фільтром</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={createStudent}>
        <h3>Створити студентський акаунт</h3>
        <div className="form-grid">
          <input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="ПІБ" required />
          <input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="Email" type="email" required />
          <input value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Пароль" type="password" required />
          <select value={studentForm.group_id} onChange={(e) => setStudentForm({ ...studentForm, group_id: e.target.value })} required>
            <option value="">Оберіть групу</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>{group.name} ({group.year} курс)</option>
            ))}
          </select>
          <button type="submit">Створити студента</button>
        </div>
      </form>

      <div className="card">
        <h3>Фільтр студентів</h3>
        <input
          type="text"
          placeholder="Пошук за ім'ям"
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Фото</th>
              <th>ПІБ</th>
              <th>Email</th>
              <th>Група</th>
              <th>Акаунт</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td><PhotoUploadCell currentUrl={student.photo_url || student.user_id?.photo_url} onUpload={(file) => uploadStudentPhoto(student._id, file)} /></td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.group_id?.name || '-'}</td>
                <td>{student.user_id?.isActive ? 'active' : 'inactive'}</td>
                <td><button className="danger" onClick={() => deleteStudent(student._id)}>Видалити</button></td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={6}>Нічого не знайдено за цим фільтром</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Admin;
