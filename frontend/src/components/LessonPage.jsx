import React, { useMemo } from 'react';

const LessonPage = ({ lessons, selectedLessonId, onSelectLesson }) => {
  const sorted = useMemo(
    () => [...lessons].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [lessons]
  );

  return (
    <div>
      <h3>Список занять</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Група</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((lesson) => (
              <tr key={lesson._id}>
                <td>{lesson.subject}</td>
                <td>{lesson.group_id?.name || '-'}</td>
                <td>{new Date(lesson.date).toLocaleString('uk-UA')}</td>
                <td>
                  <button
                    className={selectedLessonId === lesson._id ? 'secondary' : ''}
                    onClick={() => onSelectLesson(lesson._id)}
                  >
                    {selectedLessonId === lesson._id ? 'Обрано' : 'Обрати'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LessonPage;
