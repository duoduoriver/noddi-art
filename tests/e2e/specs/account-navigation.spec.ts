import { expect, test } from '@playwright/test';
import {
  cleanupE2EUsers,
  loginByForm,
  registerE2EUser,
} from '../fixtures/auth';

test.describe('personal account navigation', () => {
  test.beforeAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test('shows projects, credits, and account settings without legacy links', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);
    await loginByForm(page, user);

    const navigation = page.locator('[data-slot="sidebar"]');
    await expect(
      navigation.locator('a[href$="/dashboard/projects"]')
    ).toBeVisible();
    await expect(
      navigation.locator('a[href$="/dashboard/credits"]')
    ).toBeVisible();
    await expect(
      navigation.locator('a[href$="/settings/profile"]')
    ).toBeVisible();
    await expect(
      navigation.getByText('Dashboard', { exact: true })
    ).toHaveCount(0);
    await expect(navigation.getByText('History', { exact: true })).toHaveCount(
      0
    );
  });
});
