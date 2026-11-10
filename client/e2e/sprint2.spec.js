import { test, expect } from '@playwright/test';

test.describe('Sprint 2 E2E: M2 Specialist Linking & M3 Weekly Schedule', () => {
  test('parent signs in, views linked specialists, and manages weekly schedule', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Demo: Parent' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(
      page.getByRole('heading', { name: 'Parent Dashboard (Walking Skeleton)' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Linked Specialists' }).click();
    await expect(
      page.getByRole('heading', { name: 'Linked Specialists' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Weekly Schedule' }).click();
    await expect(
      page.getByRole('heading', { name: 'Weekly Schedule' }),
    ).toBeVisible();
  });
});
