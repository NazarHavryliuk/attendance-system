import React from 'react';

const StudentList = ({ students, onDelete }) => {
  if (!students.length) {
    return <p>Студентів поки немає.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ПІБ</th>
            <th>Email</th>
            <th>Група</th>
            <th>Акаунт</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>{student.group_id?.name || '-'}</td>
              <td>{student.user_id?.isActive ? 'active' : 'inactive'}</td>
              <td>
                <button className="danger" onClick={() => onDelete(student._id)}>
                  Видалити
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
