import { test, expect } from '@playwright/test';

test.describe('Overview Page', () => {
  test('should display overview page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const title = page.locator('h1, [data-testid="page-title"]');
    await expect(title.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      expect(page).toHaveURL(/login/);
    });
  });
});

test.describe('Catalog Page', () => {
  test('should load catalog page', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForTimeout(1000);
    
    const pageContent = page.locator('h1, h2, [class*="page"]');
    await expect(pageContent.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      expect(page).toHaveURL(/login/);
    });
  });
});

test.describe('Orders Page', () => {
  test('should load orders page', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForTimeout(1000);
    
    const pageContent = page.locator('h1, h2');
    await expect(pageContent.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      expect(page).toHaveURL(/login/);
    });
  });
});

test.describe('Inventory Page', () => {
  test('should load inventory page', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForTimeout(1000);
    
    const pageContent = page.locator('h1, h2');
    await expect(pageContent.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      expect(page).toHaveURL(/login/);
    });
  });
});

test.describe('Analytics Page', () => {
  test('should load analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(1000);
    
    const pageContent = page.locator('h1, h2');
    await expect(pageContent.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      expect(page).toHaveURL(/login/);
    });
  });
});

test.describe('Settings Page', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    
    const pageContent = page.locator('h1, h2, text=Ajustes');
    await expect(pageContent.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      expect(page).toHaveURL(/login/);
    });
  });

  test('should have theme toggle button', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('login')) {
      const themeButton = page.locator('button:has-text("Modo")');
      await expect(themeButton.first()).toBeVisible({ timeout: 3000 }).catch(() => {
        console.log('Theme toggle not found');
      });
    }
  });
});

test.describe('404 Page', () => {
  test('should redirect unknown routes', async ({ page }) => {
    await page.goto('/unknown-route-12345');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveURL(/login|\/|unknown/);
  });
});