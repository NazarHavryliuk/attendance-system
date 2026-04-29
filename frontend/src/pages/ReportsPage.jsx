import React, { useEffect, useState } from 'react';
import { groupsApi, lessonsApi, reportsApi, studentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportsPage = () => {
  const { user, studentProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [groupReport, setGroupReport] = useState(null);
  const [groupTable, setGroupTable] = useState(null);
  const [lessonReport, setLessonReport] = useState(null);
  const [subjectReport, setSubjectReport] = useState([]);
  const [error, setError] = useState('');

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
    const lessonRes = await reportsApi.lesson(targetLessonId);
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
        <h3>Параметри</h3>
        <div className="form-grid">
          {user.role !== 'student' ? (
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Оберіть студента</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
          ) : (
            <input value={studentProfile?.name || ''} disabled />
          )}
          <button onClick={submitStudent}>Звіт студента</button>

          {user.role !== 'student' && (
            <>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">Оберіть групу</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <button onClick={submitGroup}>Звіт групи</button>

              <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
                <option value="">Оберіть заняття</option>
                {lessons.map((lesson) => (
                  <option key={lesson._id} value={lesson._id}>
                    {lesson.subject} - {new Date(lesson.date).toLocaleDateString('uk-UA')}
                  </option>
                ))}
              </select>
              <button onClick={submitLesson}>Звіт заняття</button>
            </>
          )}
        </div>
      </div>

      {studentReport && (
        <div className="card">
          <h3>Звіт по студенту</h3>
          <p>Студент: {studentReport.student?.name}</p>
          <p>Всього: {studentReport.stats?.total}</p>
          <p>Присутній: {studentReport.stats?.present}</p>
          <p>Відсутній: {studentReport.stats?.absent}</p>
          <p>Відвідуваність: {studentReport.stats?.attendanceRate}%</p>
        </div>
      )}

      {subjectReport.length > 0 && (
        <div className="table-wrapper">
          <table>
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

      {groupReport && (
        <div className="card">
          <h3>Звіт по групі</h3>
          <p>Група: {groupReport.group?.name}</p>
          <p>Студентів: {groupReport.studentsCount}</p>
          <p>Занять: {groupReport.lessonsCount}</p>
          <p>Відвідуваність: {groupReport.attendanceRate}%</p>
        </div>
      )}

      {groupTable && (
        <div className="table-wrapper">
          <table>
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

      {lessonReport && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {lessonReport.rows.map((row) => (
                <tr key={row.studentId}>
                  <td>{row.studentName}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ReportsPage;
