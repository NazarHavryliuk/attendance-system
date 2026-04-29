import React, { useState } from 'react';

const AttendanceForm = ({ students, selectedLessonId, onSubmitAttendance }) => {
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState('present');

  const submit = async (e) => {
    e.preventDefault();

    if (!selectedLessonId || !studentId) {
      return;
    }

    await onSubmitAttendance({
      lesson_id: selectedLessonId,
      student_id: studentId,
      status,
    });

    setStudentId('');
    setStatus('present');
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3>Форма відмітки відвідування</h3>
      <p>Оберіть заняття та студента, потім проставте статус.</p>

      <label>
        Студент
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
          <option value="">Оберіть студента</option>
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.name} ({student.group_id?.name || 'без групи'})
            </option>
          ))}
        </select>
      </label>

      <label>
        Статус
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="present">Присутній</option>
          <option value="absent">Відсутній</option>
        </select>
      </label>

      <button type="submit" disabled={!selectedLessonId}>
        Зберегти відвідування
      </button>
    </form>
  );
};

export default AttendanceForm;
