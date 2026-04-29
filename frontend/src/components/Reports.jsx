import React from 'react';

const Reports = ({ studentReport, groupReport, stats }) => {
  return (
    <div className="grid-two">
      <section className="card">
        <h3>Звіт по студенту</h3>
        {studentReport ? (
          <>
            <p><strong>Студент:</strong> {studentReport.student?.name}</p>
            <p><strong>Група:</strong> {studentReport.student?.group_id?.name || '-'}</p>
            <p><strong>Всього відміток:</strong> {studentReport.stats?.total}</p>
            <p><strong>Присутній:</strong> {studentReport.stats?.present}</p>
            <p><strong>Відсутній:</strong> {studentReport.stats?.absent}</p>
            <p><strong>Відсоток:</strong> {studentReport.stats?.attendanceRate}%</p>
          </>
        ) : (
          <p>Оберіть студента, щоб переглянути звіт.</p>
        )}
      </section>

      <section className="card">
        <h3>Звіт по групі</h3>
        {groupReport ? (
          <>
            <p><strong>Група:</strong> {groupReport.group?.name}</p>
            <p><strong>Курс:</strong> {groupReport.group?.year}</p>
            <p><strong>К-сть студентів:</strong> {groupReport.studentsCount}</p>
            <p><strong>К-сть занять:</strong> {groupReport.lessonsCount}</p>
            <p><strong>Всього відміток:</strong> {groupReport.total}</p>
            <p><strong>Відсоток відвідуваності:</strong> {groupReport.attendanceRate}%</p>
          </>
        ) : (
          <p>Оберіть групу, щоб переглянути звіт.</p>
        )}
      </section>

      <section className="card full">
        <h3>Статистика студента</h3>
        {stats ? (
          <>
            <p><strong>Всього:</strong> {stats.total}</p>
            <p><strong>Присутній:</strong> {stats.present}</p>
            <p><strong>Відсутній:</strong> {stats.absent}</p>
            <p><strong>Відвідуваність:</strong> {stats.attendanceRate}%</p>
          </>
        ) : (
          <p>Статистика зʼявиться після вибору студента.</p>
        )}
      </section>
    </div>
  );
};

export default Reports;
