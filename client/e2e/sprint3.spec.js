import { test, expect } from '@playwright/test';

test.describe('Sprint 3 E2E: 3 Critical Flows (v0.2)', () => {
  test('Flow 1: Parent links a specialist and verifies linked list', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Demo: Parent' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.getByRole('button', { name: 'Linked Specialists' }).click();
    await expect(
      page.getByRole('heading', { name: /^Linked Specialists/ }),
    ).toBeVisible();

    await page.getByLabel('Specialist Email').fill('elif.arslan@example.com');
    await page.getByRole('button', { name: 'Link Specialist' }).click();
    await expect(page.getByText('Elif Arslan')).toBeVisible();
  });

  test('Flow 2: Specialist assigns task, child marks it done, parent views statistics', async ({
    page,
  }) => {
    const taskTitle = `E2E Practice ${Date.now()}`;

    await page.goto('/');
    await page
      .getByRole('button', { name: 'Demo: Specialist (Linked)' })
      .click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.getByRole('button', { name: 'Tasks' }).click();
    await page.getByLabel('Task Title').fill(taskTitle);
    await page.getByRole('button', { name: 'Assign Task' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await page.getByRole('button', { name: 'Demo: Child' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();
    await page.getByRole('button', { name: 'Mark as Done' }).first().click();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await page.getByRole('button', { name: 'Demo: Parent' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.getByRole('button', { name: 'Statistics' }).click();
    await expect(
      page.getByRole('heading', { name: /^Overall Completion:/ }),
    ).toBeVisible();
  });

  test('Flow 3: Parent generates role-based AI summary and submits helpful feedback', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Demo: Parent' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.getByRole('button', { name: 'AI Summary', exact: true }).click();
    await page
      .getByRole('button', { name: 'Generate Weekly AI Summary' })
      .click();

    await expect(page.getByText('AI-generated').first()).toBeVisible();
    await page.getByRole('button', { name: 'Helpful' }).first().click();
    await expect(page.getByText(/Feedback recorded:/).first()).toBeVisible();
  });
});
