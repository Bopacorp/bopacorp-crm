import { expect, type Page } from '@playwright/test';

export type TestRole = 'admin' | 'manager' | 'supervisor' | 'advisor' | 'coordinator';

export const roleAccounts: TestRole[] = [
  'admin',
  'manager',
  'supervisor',
  'advisor',
  'coordinator',
];

const navigationByRole: Record<TestRole, string[]> = {
  admin: [
    'Overview',
    'Clientes',
    'Negociaciones',
    'Catálogo',
    'Documentación',
    'Reportes',
    'Empleabilidad',
    'Organización',
  ],
  manager: [
    'Overview',
    'Clientes',
    'Negociaciones',
    'Catálogo',
    'Documentación',
    'Reportes',
    'Empleabilidad',
    'Organización',
  ],
  supervisor: ['Overview', 'Clientes', 'Negociaciones', 'Reportes'],
  advisor: ['Overview', 'Clientes', 'Negociaciones'],
  coordinator: ['Clientes', 'Negociaciones', 'Documentación'],
};

const hiddenNavigationByRole: Partial<Record<TestRole, string[]>> = {
  supervisor: ['Catálogo', 'Documentación', 'Organización'],
  advisor: ['Catálogo', 'Documentación', 'Reportes', 'Organización'],
  coordinator: ['Catálogo', 'Reportes', 'Organización'],
};

export interface TestCredentials {
  email: string;
  password: string;
}

export function getCredentials(role: TestRole): TestCredentials {
  const roleKey = role.toUpperCase();
  const email =
    process.env[`E2E_${roleKey}_EMAIL`] ?? process.env[`VITE_CRM_TEST_${roleKey}_EMAIL`];
  const password =
    process.env[`E2E_${roleKey}_PASSWORD`] ?? process.env[`VITE_CRM_TEST_${roleKey}_PASSWORD`];

  if (!email || !password) {
    throw new Error(
      `Missing credentials for ${role}. Set E2E_${roleKey}_EMAIL and E2E_${roleKey}_PASSWORD.`,
    );
  }

  return { email, password };
}

export function expectedHomePath(role: TestRole): string {
  return role === 'coordinator' ? '/documentacion' : '/overview';
}

export async function loginThroughUi(page: Page, role: TestRole): Promise<void> {
  const credentials = getCredentials(role);
  await page.goto('/login');
  await expect(page.getByText('BOPACORP', { exact: true })).toBeVisible();
  await page.getByLabel('Correo electrónico').fill(credentials.email);
  await page.getByLabel('Contraseña').fill(credentials.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedHomePath(role)}$`));
}

export async function assertRoleNavigation(page: Page, role: TestRole): Promise<void> {
  const sidebar = page.locator('[data-slot="sidebar-inner"]');
  for (const label of navigationByRole[role]) {
    await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible();
  }

  for (const label of hiddenNavigationByRole[role] ?? []) {
    await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveCount(0);
  }
}

export async function logoutThroughUi(page: Page, role: TestRole): Promise<void> {
  const email = getCredentials(role).email;
  await page.getByRole('button', { name: new RegExp(escapeRegExp(email)) }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
