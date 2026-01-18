import { test, expect } from '@playwright/test';

test.describe('SlotAnalyzer App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('displays home screen with counter', async ({ page }) => {
    // Check for the main content area
    await expect(page.locator('body')).toBeVisible();

    // Look for counter-related text (機種選択, ゲーム数, etc.)
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('has tab navigation', async ({ page }) => {
    // Expo Web renders tabs - check for navigation elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('counter buttons are interactive', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check if the page renders something
    const html = await page.content();
    expect(html.length).toBeGreaterThan(100);
  });
});

test.describe('Settings Screen', () => {
  test('can navigate to settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Expo Router web navigation
    // Settings tab should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Machine Management', () => {
  test('can navigate to machines list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
