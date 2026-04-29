import React, { useEffect, useState } from 'react';
import { attendanceApi, groupsApi, lessonsApi, reportsApi, studentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportsPage = () => {
  const { user, studentProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [lessonQuery, setLessonQuery] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [groupReport, setGroupReport] = useState(null);
  const [groupTable, setGroupTable] = useState(null);
  const [lessonReport, setLessonReport] = useState(null);
  const [subjectReport, setSubjectReport] = useState([]);
  const [error, setError] = useState('');

  const visibleGroups = user.role === 'teacher'
    ? groups.filter((group) => lessons.some((lesson) => String(lesson.group_id?._id || lesson.group_id) === String(group._id)))
    : groups;

  const filteredStudents = students
    .filter((student) => student.name?.toLowerCase().includes(studentQuery.toLowerCase()))
    .slice(0, 8);

  const filteredGroups = visibleGroups
    .filter((group) => group.name?.toLowerCase().includes(groupQuery.toLowerCase()))
    .slice(0, 8);

  const filteredLessons = lessons
    .filter((lesson) => {
      const label = `${lesson.subject} (${lesson.group_id?.name || '-'}) ${lesson.start_time}-${lesson.end_time}`.toLowerCase();
      return label.includes(lessonQuery.toLowerCase());
    })
    .slice(0, 8);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsRes, lessonsRes] = await Promise.all([groupsApi.getAll(), lessonsApi.getAll()]);
        setGroups(groupsRes.data.data || []);
        setLessons(lessonsRes.data.data || []);

        if (user.role !== 'student') {
          const studentsRes = await studentsApi.getAll();
          setStudents(studentsRes.data.data || []);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Помилка завантаження даних');
      }
    };

    loadData();
  }, [user.role]);

  const runStudentReports = async (targetStudentId) => {
    const [studentRes, bySubjectRes] = await Promise.all([
      reportsApi.student(targetStudentId),
      reportsApi.studentBySubject(targetStudentId),
    ]);
    setStudentReport(studentRes.data.data);
    setSubjectReport(bySubjectRes.data.data || []);
  };

  const runGroupReports = async (targetGroupId) => {
    const [groupRes, tableRes] = await Promise.all([
      reportsApi.group(targetGroupId),
      reportsApi.groupTable(targetGroupId),
    ]);
    setGroupReport(groupRes.data.data);
    setGroupTable(tableRes.data.data);
  };

  const runLessonReport = async (targetLessonId) => {
    const lessonRes = await attendanceApi.lessonReport(targetLessonId);
    setLessonReport(lessonRes.data.data);
  };

  const submitStudent = async () => {
    try {
      setError('');
      const target = user.role === 'student' ? studentProfile?._id : studentId;
      if (!target) return;
      await runStudentReports(target);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося сформувати звіт по студенту');
    }
  };

  const submitGroup = async () => {
    try {
      setError('');
      if (!groupId) return;
      await runGroupReports(groupId);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося сформувати звіт по групі');
    }
  };

  const submitLesson = async () => {
    try {
      setError('');
      if (!lessonId) return;
      await runLessonReport(lessonId);
    } catch (e) {
      setError(e.response?.data?.message || 'Не вдалося сформувати звіт по заняттю');
    }
  };

  return (
    <section className="page">
      <h2>Звіти</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Звіт по студенту</h3>
        <div className="form-grid">
          {user.role !== 'student' ? (
            <div style={{ position: 'relative' }}>
              <input
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  setStudentId('');
                }}
                placeholder="Почніть вводити ім'я студента"
              />
              {studentQuery && !studentId && (
                <div className="card" style={{ position: 'absolute', zIndex: 2, width: '100%', marginTop: '0.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {filteredStudents.length === 0 && <p className="muted">Нічого не знайдено</p>}
                  {filteredStudents.map((student) => (
                    <button
                      key={student._id}
                      type="button"
                      style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '0.4rem' }}
                      onClick={() => {
                        setStudentId(student._id);
                        setStudentQuery(student.name);
                      }}
                    >
                      {student.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <input value={studentProfile?.name || ''} disabled />
          )}
          <button onClick={submitStudent} disabled={user.role !== 'student' && !studentId}>Звіт студента</button>
        </div>

        {studentReport && (
          <div style={{ marginTop: '1rem' }}>
            <p>Студент: {studentReport.student?.name}</p>
            <p>Всього: {studentReport.stats?.total}</p>
            <p>Присутній: {studentReport.stats?.present}</p>
            <p>Відсутній: {studentReport.stats?.absent}</p>
            <p>Відвідуваність: {studentReport.stats?.attendanceRate}%</p>
          </div>
        )}

        {subjectReport.length > 0 && (
          <div className="table-wrapper" style={{ marginTop: '1rem' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Предмет</th>
                  <th>Всього</th>
                  <th>present</th>
                  <th>absent</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {subjectReport.map((row) => (
                  <tr key={row.subject}>
                    <td>{row.subject}</td>
                    <td>{row.total}</td>
                    <td>{row.present}</td>
                    <td>{row.absent}</td>
                    <td>{row.attendanceRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {user.role !== 'student' && (
        <div className="card">
          <h3>Звіт по групі</h3>
          <div className="form-grid">
            <div style={{ position: 'relative' }}>
              <input
                value={groupQuery}
                onChange={(e) => {
                  setGroupQuery(e.target.value);
                  setGroupId('');
                }}
                placeholder="Почніть вводити назву групи"
              />
              {groupQuery && !groupId && (
                <div className="card" style={{ position: 'absolute', zIndex: 2, width: '100%', marginTop: '0.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {filteredGroups.length === 0 && <p className="muted">Нічого не знайдено</p>}
                  {filteredGroups.map((group) => (
                    <button
                      key={group._id}
                      type="button"
                      style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '0.4rem' }}
                      onClick={() => {
                        setGroupId(group._id);
                        setGroupQuery(group.name);
                      }}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={submitGroup} disabled={!groupId}>Звіт групи</button>
          </div>

          {groupReport && (
            <div style={{ marginTop: '1rem' }}>
              <p>Група: {groupReport.group?.name}</p>
              <p>Студентів: {groupReport.studentsCount}</p>
              <p>Занять: {groupReport.lessonsCount}</p>
              <p>Відвідуваність: {groupReport.attendanceRate}%</p>
            </div>
          )}

          {groupTable && (
            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Студент</th>
                    {groupTable.lessonColumns.map((c) => (
                      <th key={c.id}>{c.subject}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupTable.rows.map((row) => (
                    <tr key={row.studentId}>
                      <td>{row.studentName}</td>
                      {groupTable.lessonColumns.map((c) => {
                        const pct = row.attendanceByLesson[c.id];
                        return (
                          <td key={c.id} style={{ textAlign: 'center', fontWeight: 'bold', color: pct === null ? '#888' : pct >= 75 ? '#2e7d32' : '#c62828' }}>
                            {pct === null ? '—' : `${pct}%`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {user.role !== 'student' && (
        <div className="card">
          <h3>Звіт по заняттю (по всіх проведених сесіях)</h3>
          <div className="form-grid">
            <div style={{ position: 'relative' }}>
              <input
                value={lessonQuery}
                onChange={(e) => {
                  setLessonQuery(e.target.value);
                  setLessonId('');
                }}
                placeholder="Почніть вводити назву предмета або групу"
              />
              {lessonQuery && !lessonId && (
                <div className="card" style={{ position: 'absolute', zIndex: 2, width: '100%', marginTop: '0.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {filteredLessons.length === 0 && <p className="muted">Нічого не знайдено</p>}
                  {filteredLessons.map((lesson) => {
                    const label = `${lesson.subject} (${lesson.group_id?.name || '-'}) ${lesson.start_time}-${lesson.end_time}`;
                    return (
                      <button
                        key={lesson._id}
                        type="button"
                        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '0.4rem' }}
                        onClick={() => {
                          setLessonId(lesson._id);
                          setLessonQuery(label);
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={submitLesson} disabled={!lessonId}>Звіт заняття</button>
          </div>

          {lessonReport && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Матриця відвідуваності по заняттю</h3>
              {lessonReport.sessions?.length === 0 ? (
                <p>Немає сесій для цього заняття. Спочатку додайте дати проведення.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Студент</th>
                        {lessonReport.sessions.map((session) => (
                          <th key={session._id}>
                            {new Date(session.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </th>
                        ))}
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonReport.rows.map((row) => (
                        <tr key={String(row.student_id)}>
                          <td>{row.name}</td>
                          {row.presence.map((present, idx) => (
                            <td
                              key={`${row.student_id}-${idx}`}
                              style={{ textAlign: 'center', color: present ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}
                            >
                              {present ? '✓' : '✗'}
                            </td>
                          ))}
                          <td style={{ fontWeight: 'bold', color: row.percentage >= 75 ? '#2e7d32' : '#c62828' }}>
                            {row.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ReportsPage;
