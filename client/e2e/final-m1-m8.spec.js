import { test, expect } from '@playwright/test';

async function loginAs(page, demoLabel) {
  await page.goto('/');
  await page.getByRole('button', { name: `Demo: ${demoLabel}` }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test.describe('Release v1.0 E2E Coverage: M1 through M8', () => {
  test('M1: Role-based login and child screen isolation', async ({ page }) => {
    await loginAs(page, 'Child');
    await expect(
      page.getByRole('heading', { name: /My Tasks & Schedule/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Entries', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Documents', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'AI Summary', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('M2: Parent views linked specialists and sees error for unregistered email', async ({
    page,
  }) => {
    await loginAs(page, 'Parent');
    await page.getByRole('button', { name: 'Linked Specialists' }).click();
    await expect(page.getByText('Murat Kaya')).toBeVisible();

    await page
      .getByLabel('Specialist Email')
      .fill('unregistered.person@example.com');
    await page.getByRole('button', { name: 'Link Specialist' }).click();
    await expect(
      page.getByText(/No registered specialist found/),
    ).toBeVisible();
  });

  test('M3: Parent adds a weekly schedule event and sees it listed', async ({
    page,
  }) => {
    const eventTitle = `E2E Therapy ${Date.now()}`;
    await loginAs(page, 'Parent');
    await page.getByRole('button', { name: 'Weekly Schedule' }).click();
    await page.getByLabel('Event Title').fill(eventTitle);
    await page.getByRole('button', { name: 'Add Event' }).click();
    await expect(page.getByText(eventTitle)).toBeVisible();
  });

  test('M4: Parent assigns a task and child marks it as done', async ({
    page,
  }) => {
    const taskTitle = `E2E Reading ${Date.now()}`;
    await loginAs(page, 'Parent');
    await page.getByRole('button', { name: 'Tasks' }).click();
    await page.getByLabel('Task Title').fill(taskTitle);
    await page.getByRole('button', { name: 'Assign Task' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();

    await loginAs(page, 'Child');
    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();
    await page.getByRole('button', { name: 'Mark as Done' }).first().click();
    await expect(page.getByText('Task marked as done')).toBeVisible();
  });

  test('M5: Linked specialist adds and edits an observation entry (marked edited)', async ({
    page,
  }) => {
    const entryTitle = `E2E Observation ${Date.now()}`;
    await loginAs(page, 'Specialist (Linked)');
    await page.getByRole('button', { name: 'Entries', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill(entryTitle);
    await page
      .getByLabel('Observation Notes')
      .fill('Initial observation text.');
    await page.getByRole('button', { name: 'Save Entry' }).click();
    await expect(page.getByText(entryTitle)).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page
      .getByLabel('Edit entry content')
      .fill('Updated observation text.');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('edited').first()).toBeVisible();
  });

  test('M6: Parent uploads a PDF document and sees it in the documents list', async ({
    page,
  }) => {
    const docName = `E2E_Report_${Date.now()}.pdf`;
    await loginAs(page, 'Parent');
    await page.getByRole('button', { name: 'Documents', exact: true }).click();
    await page.getByLabel('Document Name').fill(docName);
    await page.getByLabel('File (PDF / Image)').setInputFiles({
      name: docName,
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%Synthetic E2E test PDF\n'),
    });
    await page.getByRole('button', { name: 'Upload Document' }).click();
    await expect(page.getByText(docName)).toBeVisible();
  });

  test('M7: Parent views weekly completion statistics overall and by area', async ({
    page,
  }) => {
    await loginAs(page, 'Parent');
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: /^Overall Completion:/ }),
    ).toBeVisible();
  });

  test('M8: Parent generates role-based AI summary with source records and feedback', async ({
    page,
  }) => {
    await loginAs(page, 'Parent');
    await page.getByRole('button', { name: 'AI Summary', exact: true }).click();
    await page
      .getByRole('button', { name: 'Generate Weekly AI Summary' })
      .click();
    await expect(page.getByText('AI-generated').first()).toBeVisible();
    await page.getByRole('button', { name: 'Helpful' }).first().click();
    await expect(page.getByText(/Feedback recorded:/).first()).toBeVisible();
  });
});
