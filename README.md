# Система обліку відвідуваності студентів

Навчальний full-stack веб-застосунок для ведення відвідуваності студентів у форматі клієнт-серверної архітектури.

## 1. Технології

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- CORS
- REST API (JSON)


### Frontend
- React + Vite
- React Router
- Axios
- Адаптивний CSS

## 2. Структура проєкту

```
project/
  backend/
    config/
    models/
    controllers/
    routes/
    middlewares/
    services/
    tests/
    server.js
  frontend/
    public/
      index.html
    src/
      components/
      pages/
      services/
      App.js
```

## 3. Функціонал
- JWT авторизація (login) і захищені endpoint-и
- Ролі доступу: `admin`, `teacher`, `student`
- Адмін: створення/видалення акаунтів викладачів, керування групами з прив'язкою до викладача, формування звітів, зміна власного пароля
- Викладач: створення/видалення акаунтів студентів, додавання студентів у власні групи, створення/видалення занять для власних груп, формування звітів, зміна власного пароля
- Студент: вхід у власний акаунт, відмітка присутності на заняттях своєї групи, перегляд власної відвідуваності та зміна пароля

## 4. Запуск проєкту

### Передумови
- Node.js 18+
- MongoDB (локально або Atlas)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Сервер запускається на `http://localhost:3000`.

### Перший запуск (створення admin)
Після старту backend виконайте одноразово:

```bash
1. Задайте в `backend/.env` секрет для початкового створення admin:

```env
BOOTSTRAP_ADMIN_PASSWORD=your_random_bootstrap_password
```

2. Після старту backend виконайте одноразово:

```bash
curl -X POST http://localhost:3000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"admin123","bootstrapPassword":"your_random_bootstrap_password"}'
```

Після цього увійдіть через `/api/auth/login` і використовуйте JWT токен у заголовку:

`Authorization: Bearer <TOKEN>`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend запускається на `http://localhost:5173`.

## 5. API endpoint-и

### Auth
- POST /api/auth/bootstrap-admin
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/change-password

### Groups
- GET /api/groups
- POST /api/groups/register
- PUT /api/groups/:id
- DELETE /api/groups/:id

### Students
- GET /api/students
- POST /api/students/register
- PUT /api/students/:id
- DELETE /api/students/:id

### Lessons
- GET /api/lessons
- POST /api/lessons/register
- DELETE /api/lessons/:id

### Attendance
- POST /api/attendance/register
- GET /api/attendance/:lessonId

### Statistics/Reports
- GET /api/statistics/:studentId
- GET /api/report/student/:id
- GET /api/report/student/:id/by-subject
- GET /api/report/group/:groupId
- GET /api/report/group/:groupId/attendance-table
- GET /api/report/lesson/:lessonId

### Admin (users)
- GET /api/users
- POST /api/users/register
- PUT /api/users/:id
- DELETE /api/users/:id

## 5.1 Політика доступу по ролях
- `admin`: керування викладачами, групами, звітами
- `teacher`: керування студентами, заняттями, відвідуваністю і звітами лише для власних груп
- `student`: лише власна присутність та власні звіти

## 6. Опис БД (MongoDB колекції)
- `users`: name, email, password(hash), role(admin/teacher/student), isActive
- `groups`: name, year, teacher_id
- `students`: user_id, name, email,  group_id
- `lessons`: subject, date, group_id, created_by
- `attendance`: lesson_id, student_id, status

## 7. Приклади запитів (curl)

### Вхід у систему
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Створити викладача (admin)
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Teacher 1","email":"teacher1@example.com","password":"teach123"}'
```

### Створити групу (admin)
```bash
curl -X POST http://localhost:3000/api/groups/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"IPZ-31","year":3,"teacher_id":"<TEACHER_ID>"}'
```

### Створити студента (teacher)
```bash
curl -X POST http://localhost:3000/api/students/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Іван Петренко","email":"ivan@example.com","password":"stud123","group_id":"<GROUP_ID>"}'
```

### Створити заняття
```bash
curl -X POST http://localhost:3000/api/lessons/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"subject":"Бази даних","date":"2026-04-28T09:00:00.000Z","group_id":"<GROUP_ID>"}'
```

### Відмітити відвідування
```bash
curl -X POST http://localhost:3000/api/attendance/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"lesson_id":"<LESSON_ID>","student_id":"<STUDENT_ID>","status":"present"}'
```

### Звіт по студенту
```bash
curl http://localhost:3000/api/report/student/<STUDENT_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

## 8. Тестування
- Автоматизований приклад: `backend/tests/api.test.js`
- План тестування: `TEST_PLAN.md`
- Додатково перевірка endpoint-ів через Postman

## 9. Відповідність лабораторним роботам №1-5
1. ЛР1: Аналіз вимог і SRS (реалізовано через структурований функціонал і ролі)
2. ЛР2: Проєктування БД (MongoDB колекції + зв'язки)
3. ЛР3: Реалізація backend REST API (Node.js/Express/Mongoose)
4. ЛР4: Реалізація frontend клієнта (React + API інтеграція)
5. ЛР5: Тестування, звіти, обробка помилок, документація