import { test } from '@playwright/test';
import {
  assertRoleNavigation,
  loginThroughUi,
  logoutThroughUi,
  roleAccounts,
} from './support/auth.js';

for (const role of roleAccounts) {
  test(`E2E-CRM-08 ${role} can login, navigate by role, and logout`, async ({ page }, testInfo) => {
    await loginThroughUi(page, role);
    await assertRoleNavigation(page, role);

    if (role === 'advisor' || role === 'coordinator') {
      await page.screenshot({
        path: testInfo.outputPath(`evidence/${role}-navigation.png`),
        fullPage: true,
      });
    }

    await logoutThroughUi(page, role);
  });
}
