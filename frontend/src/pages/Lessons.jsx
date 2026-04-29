import React, { useEffect, useMemo, useState } from 'react';
import { attendanceApi, groupsApi, lessonSessionsApi, lessonsApi, studentsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAY_OPTIONS = [
  { value: 'monday', label: 'Понеділок' },
  { value: 'tuesday', label: 'Вівторок' },
  { value: 'wednesday', label: 'Середа' },
  { value: 'thursday', label: 'Четвер' },
  { value: 'friday', label: 'Пʼятниця' },
  { value: 'saturday', label: 'Субота' },
  { value: 'sunday', label: 'Неділя' },
];

const Lessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [lessonForm, setLessonForm] = useState({
    subject: '',
    group_id: '',
    teacher_id: '',
    day_of_week: 'monday',
    start_time: '08:30',
    end_time: '10:00',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reportLessonId, setReportLessonId] = useState(null);
  const [reportRecords, setReportRecords] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [sessionPanelId, setSessionPanelId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [matrixLessonId, setMatrixLessonId] = useState(null);
  const [matrixData, setMatrixData] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const loadData = async () => {
    try {
      const requests = [lessonsApi.getAll(), groupsApi.getAll()];
      if (user.role === 'admin') {
        requests.push(usersApi.getAll());
      }

      const [lessonsRes, groupsRes, teachersRes] = await Promise.all(requests);
      setLessons(lessonsRes.data.data || []);
      setGroups(groupsRes.data.data || []);
      if (teachersRes) {
        setTeachers(teachersRes.data.data || []);
      }

      if (user.role === 'teacher' || user.role === 'admin') {
        const studentsRes = await studentsApi.getAll();
        setStudents(studentsRes.data.data || []);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Помилка завантаження занять');
    }
  };

  useEffect(() => {
    loadData();
  }, [user.role]);

  const submitLesson = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await lessonsApi.create(lessonForm);
      setLessonForm({
        subject: '',
        group_id: '',
        teacher_id: '',
        day_of_week: 'monday',
        start_time: '08:30',
        end_time: '10:00',
      });
      setMessage('Заняття створено');
      await loadData();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Не вдалося створити заняття');
    }
  };

  const deleteLesson = async (id) => {
    try {
      await lessonsApi.remove(id);
      setMessage('Заняття видалено');
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося видалити заняття');
    }
  };

  const filteredStudents = useMemo(() => {
    const lesson = lessons.find((item) => item._id === selectedLessonId);
    if (!lesson?.group_id?._id) {
      return [];
    }
    return students.filter((s) => s.group_id?._id === lesson.group_id._id);
  }, [lessons, selectedLessonId, students]);

  const loadSessionPanel = async (lessonId) => {
    if (sessionPanelId === lessonId) {
      setSessionPanelId(null);
      setSessions([]);
      return;
    }
    setSessionsLoading(true);
    setSessionPanelId(lessonId);
    try {
      const res = await lessonSessionsApi.byLesson(lessonId);
      setSessions(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося завантажити сесії');
      setSessionPanelId(null);
    } finally {
      setSessionsLoading(false);
    }
  };

  const addSession = async (lessonId) => {
    setError('');
    try {
      await lessonSessionsApi.create({ lesson_id: lessonId, date: sessionDate });
      setMessage('Сесію додано');
      const res = await lessonSessionsApi.byLesson(lessonId);
      setSessions(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося додати сесію');
    }
  };

  const deleteSession = async (sessionId, lessonId) => {
    setError('');
    try {
      await lessonSessionsApi.remove(sessionId);
      setMessage('Сесію видалено');
      const res = await lessonSessionsApi.byLesson(lessonId);
      setSessions(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося видалити сесію');
    }
  };

  const loadMatrix = async (lessonId) => {
    if (matrixLessonId === lessonId) {
      setMatrixLessonId(null);
      setMatrixData(null);
      return;
    }
    setMatrixLoading(true);
    setMatrixLessonId(lessonId);
    try {
      const res = await attendanceApi.lessonReport(lessonId);
      setMatrixData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося завантажити звіт');
      setMatrixLessonId(null);
    } finally {
      setMatrixLoading(false);
    }
  };

  const loadReport = async (lessonId) => {
    if (reportLessonId === lessonId) {
      setReportLessonId(null);
      setReportRecords([]);
      return;
    }
    setReportLoading(true);
    setReportLessonId(lessonId);
    try {
      const res = await attendanceApi.byLesson(lessonId);
      const sorted = (res.data.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setReportRecords(sorted);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося завантажити звіт');
      setReportLessonId(null);
    } finally {
      setReportLoading(false);
    }
  };

  const markAttendance = async (payload) => {
    try {
      await attendanceApi.register(payload);
      setMessage('Відвідування збережено');
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося зберегти відвідування');
    }
  };

  return (
    <section className="page">
      <h2>Заняття</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {user.role === 'admin' && (
        <form className="card" onSubmit={submitLesson}>
          <h3>Створити заняття</h3>
          <div className="form-grid">
            <input
              placeholder="Предмет"
              value={lessonForm.subject}
              onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
              required
            />
            <select
              value={lessonForm.group_id}
              onChange={(e) => setLessonForm({ ...lessonForm, group_id: e.target.value })}
              required
            >
              <option value="">Оберіть групу</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name} ({group.year} курс)
                </option>
              ))}
            </select>
            <select
              value={lessonForm.teacher_id}
              onChange={(e) => setLessonForm({ ...lessonForm, teacher_id: e.target.value })}
              required
            >
              <option value="">Оберіть викладача</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <select
              value={lessonForm.day_of_week}
              onChange={(e) => setLessonForm({ ...lessonForm, day_of_week: e.target.value })}
              required
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={lessonForm.start_time}
              onChange={(e) => setLessonForm({ ...lessonForm, start_time: e.target.value })}
              required
            />
            <input
              type="time"
              value={lessonForm.end_time}
              onChange={(e) => setLessonForm({ ...lessonForm, end_time: e.target.value })}
              required
            />
            <button type="submit">Створити</button>
          </div>
        </form>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Група</th>
              <th>Викладач</th>
              <th>День</th>
              <th>Час</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr key={lesson._id}>
                <td>{lesson.subject}</td>
                <td>{lesson.group_id?.name || '-'}</td>
                <td>{lesson.teacher_id?.name || '-'}</td>
                <td>{DAY_OPTIONS.find((day) => day.value === lesson.day_of_week)?.label || '-'}</td>
                <td>{lesson.start_time && lesson.end_time ? `${lesson.start_time} - ${lesson.end_time}` : '-'}</td>
                <td className="actions-inline">
                  {(user.role === 'admin' || user.role === 'teacher') && (
                    <>
                      <button onClick={() => setSelectedLessonId(lesson._id)}>Вибрати</button>
                      <button type="button" onClick={() => loadSessionPanel(lesson._id)}>
                        {sessionPanelId === lesson._id ? 'Сховати сесії' : 'Сесії'}
                      </button>
                      <button type="button" onClick={() => loadMatrix(lesson._id)}>
                        {matrixLessonId === lesson._id ? 'Сховати звіт' : 'Звіт'}
                      </button>
                      {user.role === 'admin' && (
                        <button className="danger" onClick={() => deleteLesson(lesson._id)}>Видалити</button>
                      )}
                    </>
                  )}
                  {user.role === 'student' && (
                    <>
                      <button
                        type="button"
                        onClick={() => markAttendance({ lesson_id: lesson._id })}
                        disabled={!lesson.is_active_now}
                        title={lesson.is_active_now ? 'Відмітитись на поточному занятті' : 'Відмітка доступна лише під час поточного заняття'}
                      >
                        {lesson.is_active_now ? 'Відмітитись' : 'Неактивно'}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadReport(lesson._id)}
                      >
                        {reportLessonId === lesson._id ? 'Сховати звіт' : 'Звіт'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user.role === 'student' && (
        <p>
          Ви можете відмітитись лише на занятті, яке зараз триває за серверним часом.
        </p>
      )}

      {user.role === 'student' && reportLessonId && (() => {
        const lesson = lessons.find((l) => l._id === reportLessonId);
        return (
          <div className="card">
            <h3>
              Звіт відвідуваності: {lesson?.subject || 'Заняття'}
            </h3>
            {reportLoading && <p>Завантаження...</p>}
            {!reportLoading && reportRecords.length === 0 && (
              <p>Немає записів про відвідуваність для цього заняття.</p>
            )}
            {!reportLoading && reportRecords.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Дата</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRecords.map((record, idx) => (
                      <tr key={record._id}>
                        <td>{idx + 1}</td>
                        <td>{new Date(record.date).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        <td>Присутній ✓</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {(user.role === 'admin' || user.role === 'teacher') && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            markAttendance({
              lesson_id: selectedLessonId,
              student_id: form.get('student_id'),
            });
          }}
        >
          <h3>Відмітка присутності</h3>
          <div className="form-grid">
            <select name="student_id" required defaultValue="">
              <option value="">Оберіть студента</option>
              {filteredStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!selectedLessonId}>Зберегти</button>
          </div>
        </form>
      )}

      {(user.role === 'admin' || user.role === 'teacher') && sessionPanelId && (() => {
        const lesson = lessons.find((l) => l._id === sessionPanelId);
        return (
          <div className="card">
            <h3>Сесії заняття: {lesson?.subject || 'Заняття'}</h3>
            {(user.role === 'teacher' || user.role === 'admin') && (
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
                <button type="button" onClick={() => addSession(sessionPanelId)}>
                  Додати сесію
                </button>
              </div>
            )}
            {sessionsLoading && <p>Завантаження...</p>}
            {!sessionsLoading && sessions.length === 0 && (
              <p>Немає записів про проведені сесії.</p>
            )}
            {!sessionsLoading && sessions.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Дата проведення</th>
                      <th>Додав</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, idx) => (
                      <tr key={s._id}>
                        <td>{idx + 1}</td>
                        <td>{new Date(s.date).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        <td>{s.created_by?.name || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => deleteSession(s._id, sessionPanelId)}
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {(user.role === 'admin' || user.role === 'teacher') && matrixLessonId && (() => {
        const lesson = lessons.find((l) => l._id === matrixLessonId);
        return (
          <div className="card">
            <h3>Звіт відвідуваності: {lesson?.subject || 'Заняття'}</h3>
            {matrixLoading && <p>Завантаження...</p>}
            {!matrixLoading && matrixData && matrixData.sessions.length === 0 && (
              <p>Немає сесій для цього заняття. Спочатку додайте сесії.</p>
            )}
            {!matrixLoading && matrixData && matrixData.sessions.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Студент</th>
                      {matrixData.sessions.map((s) => (
                        <th key={s._id}>
                          {new Date(s.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}
                        </th>
                      ))}
                      <th>% присутності</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.rows.map((row) => (
                      <tr key={String(row.student_id)}>
                        <td>{row.name}</td>
                        {row.presence.map((present, idx) => (
                          <td key={idx} style={{ textAlign: 'center', color: present ? '#2e7d32' : '#c62828' }}>
                            {present ? '✓' : '✗'}
                          </td>
                        ))}
                        <td style={{ fontWeight: 'bold' }}>{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
};

export default Lessons;
