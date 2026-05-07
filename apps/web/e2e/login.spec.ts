import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1, h2, [data-testid="login-title"]')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have link to register page', async ({ page }) => {
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=email, text=Email, text=correo')).toBeVisible();
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=password, text=Password, text=contraseña')).toBeVisible();
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display register form', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have link back to login', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to /login when accessing /orders without auth', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to /login when accessing /inventory without auth', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to /login when accessing /analytics without auth', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to /login when accessing root without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Navigation', () => {
  test('should allow access to login page without auth', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('should allow access to register page without auth', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });
});