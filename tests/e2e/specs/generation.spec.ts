import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { unzipSync } from 'fflate';
import {
  cleanupE2EUsers,
  loginByForm,
  registerE2EUser,
} from '../fixtures/auth';

test.describe('app icon generation and free export journey', () => {
  test.beforeAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupE2EUsers(request);
  });

  test('free user generates four concepts and exports the allowed formats', async ({
    page,
    request,
  }) => {
    const user = await registerE2EUser(request);
    await loginByForm(page, user);
    await page.goto('/generate');

    await page
      .getByLabel('Prompt')
      .fill('A simple purple timer icon with one bold black hourglass symbol.');
    await page.getByRole('button', { name: /Generate/ }).click();

    await expect(page).toHaveURL(/\/generate\?project=[0-9a-f-]+/i);
    const variationImages = page.locator('img[alt^="Variation "]');
    await expect(page.locator('img[alt="Variation A"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(variationImages).toHaveCount(4);

    const variationB = page
      .locator('button')
      .filter({ has: page.locator('img[alt="Variation B"]') });
    await variationB.click();
    await expect(variationB).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: '512', exact: true }).click();
    await page.getByRole('button', { name: 'PNG', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare image' }).click();
    const pngLink = page.getByRole('link', { name: /Download/ });
    await expect(pngLink).toBeVisible({ timeout: 30_000 });
    const [pngDownload] = await Promise.all([
      page.waitForEvent('download'),
      pngLink.click(),
    ]);
    expect(pngDownload.suggestedFilename()).toBe('icon-512.png');

    await page.getByRole('button', { name: 'WebP', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare image' }).click();
    const webpLink = page.getByRole('link', { name: /Download/ });
    await expect(webpLink).toBeVisible({ timeout: 30_000 });
    const [webpDownload] = await Promise.all([
      page.waitForEvent('download'),
      webpLink.click(),
    ]);
    expect(webpDownload.suggestedFilename()).toBe('icon-512.webp');

    await page.getByRole('button', { name: 'Developer package' }).click();
    const ios = page.getByRole('checkbox', { name: /iOS/ });
    const android = page.getByRole('checkbox', { name: /Android/ });
    const web = page.getByRole('checkbox', { name: /Web/ });
    if (await ios.isChecked()) await ios.uncheck();
    await android.check();
    await web.check();
    await page.getByRole('button', { name: 'Prepare package' }).click();
    const packageLink = page.getByRole('link', { name: /Download/ });
    await expect(packageLink).toBeVisible({ timeout: 30_000 });
    const [packageDownload] = await Promise.all([
      page.waitForEvent('download'),
      packageLink.click(),
    ]);
    expect(packageDownload.suggestedFilename()).toBe(
      'sunburst-ai-android-web.zip'
    );
    const packagePath = await packageDownload.path();
    expect(packagePath).not.toBeNull();
    const files = unzipSync(new Uint8Array(await readFile(packagePath!)));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        'android/play_store_512.png',
        'web/favicon.ico',
        'web/manifest.webmanifest',
        'project.json',
      ])
    );

    await page.getByRole('button', { name: 'Image file' }).click();
    await page.getByRole('button', { name: '512', exact: true }).click();
    await page.getByRole('button', { name: 'AVIF', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare image' }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Upgrade your plan to export this icon.'
    );

    await page.getByRole('button', { name: 'PNG', exact: true }).click();
    await page.getByRole('button', { name: /1024/ }).click();
    await page.getByRole('button', { name: /Prepare image/ }).click();
    await expect(page.getByRole('alert')).toContainText(
      'You do not have enough credits for this action.'
    );

    await page.getByRole('button', { name: 'Developer package' }).click();
    const androidForPaidCheck = page.getByRole('checkbox', { name: /Android/ });
    const webForPaidCheck = page.getByRole('checkbox', { name: /Web/ });
    const iosForPaidCheck = page.getByRole('checkbox', { name: /iOS/ });
    const macosForPaidCheck = page.getByRole('checkbox', { name: /macOS/ });
    if (await androidForPaidCheck.isChecked())
      await androidForPaidCheck.uncheck();
    if (await webForPaidCheck.isChecked()) await webForPaidCheck.uncheck();
    await iosForPaidCheck.check();
    await macosForPaidCheck.check();
    await page.getByRole('button', { name: /Prepare package/ }).click();
    await expect(page.getByRole('alert')).toContainText(
      'You do not have enough credits for this action.'
    );
  });
});
