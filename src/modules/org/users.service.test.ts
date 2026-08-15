import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employee, PHASE6_TEST_IDS } from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  assignUserRoles,
  createUser,
  getUser,
  getUserLockStatus,
  listUsers,
  removeUser,
  unlockUser,
  updateUser,
} from './users.service.js';

const userId = employee.userId;

describe('user administration service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue(employee);
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: undefined });
  });

  it('maps user administration and lock operations', async () => {
    const createRequest = {
      username: 'new.user',
      email: 'new.user@example.test',
      password: 'ValidPass1!',
      isActive: true,
      profile: {
        firstName: 'New',
        lastName: 'User',
        nationalId: '0912345678',
      },
      roleIds: [PHASE6_TEST_IDS.orgRole],
    };

    await listUsers({ page: 2, limit: 20, sortOrder: 'desc', isActive: true });
    await getUser(userId);
    await createUser(createRequest);
    await updateUser(userId, { isActive: false });
    await removeUser(userId);
    await assignUserRoles(userId, { roleIds: [PHASE6_TEST_IDS.orgRole] });
    await getUserLockStatus(userId);
    await unlockUser(userId, { reason: 'Confirmed identity with the manager.' });

    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/users',
      params: { page: 2, limit: 20, sortOrder: 'desc', isActive: true },
    });
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: `/users/${userId}/unlock`,
      data: { reason: 'Confirmed identity with the manager.' },
    });
  });
});
