import { expect } from '@playwright/test';
import type { AuthenticatedApi } from './api.js';

export interface IdentifiedResource {
  id: string;
}

export async function firstResource<T extends IdentifiedResource>(
  api: AuthenticatedApi,
  path: string,
  params: Record<string, string | number | boolean> = { page: 1, limit: 100 },
): Promise<T> {
  const resources = await api.get<T[]>(path, params);
  const resource = resources[0];
  if (!resource) throw new Error(`No seeded resource available at ${path}`);
  return resource;
}

export async function waitForResourceId<T extends IdentifiedResource>(
  api: AuthenticatedApi,
  path: string,
  params: Record<string, string | number | boolean>,
  predicate: (resource: T) => boolean,
): Promise<string> {
  let resourceId = '';

  await expect
    .poll(
      async () => {
        const resources = await api.get<T[]>(path, params);
        resourceId = resources.find(predicate)?.id ?? '';
        return resourceId;
      },
      { timeout: 30_000, intervals: [250, 500, 1_000, 2_000] },
    )
    .not.toBe('');

  return resourceId;
}
