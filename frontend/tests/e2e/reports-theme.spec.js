import { expect, test } from '@playwright/test';

const mockLogin = async (page) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          token: 'fake-jwt-token',
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            photo_url: null,
          },
          studentProfile: null,
        },
      }),
    });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('admin@example.com');
  await page.getByPlaceholder('Пароль').fill('123321');
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page).toHaveURL(/\/$/);
};

test.describe('reports and theme UX', () => {
  test('theme toggle is always visible and persists selected theme', async ({ page }) => {
    await mockLogin(page);

    const toggle = page.locator('.theme-toggle-floating');
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.locator('.theme-toggle-floating')).toContainText(/Світла тема|Темна тема/);

    const storedTheme = await page.evaluate(() => localStorage.getItem('ui-theme'));
    expect(storedTheme).toBe('dark');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Світла тема' })).toBeVisible();
  });

  test('student report supports search + suggestion selection flow', async ({ page }) => {
    await page.route('**/api/groups', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [{ _id: 'g1', name: 'Group A' }] }),
      });
    });

    await page.route('**/api/lessons', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ _id: 'l1', subject: 'Programming', group_id: { _id: 'g1', name: 'Group A' }, start_time: '08:30', end_time: '10:00' }],
        }),
      });
    });

    await page.route('**/api/students', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { _id: 's1', name: 'Bohdan' },
            { _id: 's2', name: 'Andrii' },
          ],
        }),
      });
    });

    await page.route('**/api/report/student/s1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            student: { name: 'Bohdan' },
            stats: { total: 4, present: 3, absent: 1, attendanceRate: 75 },
            records: [],
          },
        }),
      });
    });

    await page.route('**/api/report/student/s1/by-subject', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { subject: 'Programming', total: 3, present: 2, absent: 1, attendanceRate: 66.67 },
          ],
        }),
      });
    });

    await mockLogin(page);
    await page.getByRole('link', { name: 'Звіти' }).click();
    await expect(page).toHaveURL(/\/reports$/);

    const studentSearch = page.getByPlaceholder(/Почніть вводити ім.я студента/);
    await studentSearch.fill('boh');

    const suggestion = page.getByRole('button', { name: 'Bohdan' });
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    await page.getByRole('button', { name: 'Звіт студента' }).click();

    await expect(page.getByText('Студент: Bohdan')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Programming' })).toBeVisible();
  });
});
