import { test, expect } from '@playwright/test';

test.describe('Application Foundation E2E Smoke Tests', () => {
  test('homepage loads successfully with correct title and status badge', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Mandala Art Store/i);

    // Check header brand link
    const brandLink = page.getByRole('link', { name: /Mandala Art Store/i });
    await expect(brandLink).toBeVisible();

    // Check phase badge
    const phaseBadge = page.getByText(/Phase: Technical Foundation/i);
    await expect(phaseBadge).toBeVisible();

    // Check main heading
    const heading = page.getByRole('heading', { level: 1, name: /Mandala Art Store/i });
    await expect(heading).toBeVisible();
  });
});
