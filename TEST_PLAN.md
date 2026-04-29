# TEST PLAN - Attendance System

## 1. Scope
- Verify backend REST API endpoints
- Verify frontend CRUD/reporting interactions
- Verify validation and error responses

## 2. Test types
- Manual API tests (Postman/curl)
- UI smoke tests in browser
- Basic automated API tests (Jest + Supertest)

## 3. API scenarios
1. Create group, then fetch groups list
2. Create student with valid group
3. Update and delete student
4. Create lesson for group
5. Register attendance present/absent
6. Get attendance by lesson id
7. Get student statistics
8. Build student and group reports
9. Manage users from admin endpoints

## 4. Negative scenarios
1. Create student with missing email -> 400
2. Create lesson with invalid group id -> 404
3. Register attendance with invalid status -> 400
4. Call unknown route -> 404

## 5. Frontend checks
1. Students page loads list and adds/removes records
2. Lessons page creates lesson and marks attendance
3. Reports page shows student/group report blocks
4. Admin page adds and deletes users
5. Layout remains usable on mobile width (<860px)

## 6. Automated tests
- File: backend/tests/api.test.js
- Run: npm test (inside backend)

## 7. Exit criteria
- All critical API routes return expected status and JSON
- Frontend loads data and handles errors without crashing
