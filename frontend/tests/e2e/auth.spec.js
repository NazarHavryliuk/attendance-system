import { expect, test } from '@playwright/test';

test.describe('authentication flow', () => {
  test('shows backend error on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');

    await page.getByPlaceholder('Email').fill('user@example.com');
    await page.getByPlaceholder('Пароль').fill('wrong-password');
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logs in and renders protected home page', async ({ page }) => {
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
      const authorization = route.request().headers().authorization;
      const isAuthorized = authorization === 'Bearer fake-jwt-token';

      await route.fulfill({
        status: isAuthorized ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify(
          isAuthorized
            ? {
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
              }
            : { success: false, message: 'Unauthorized' }
        ),
      });
    });

    await page.goto('/login');

    await page.getByPlaceholder('Email').fill('admin@example.com');
    await page.getByPlaceholder('Пароль').fill('123321');
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Система обліку відвідуваності' })).toBeVisible();
    await expect(page.getByText('Ви увійшли як:')).toContainText('Admin User');
    await expect(page.getByRole('link', { name: 'Адмін' })).toBeVisible();
  });
});