import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePermission } from './usePermission.js';

const useAuth = vi.hoisted(() => vi.fn());

vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth }));

function PermissionProbe() {
  const { hasPermission, hasAnyPermission } = usePermission();
  return (
    <>
      <p>{hasPermission('clients.read') ? 'Permission found' : 'Permission missing'}</p>
      <p>
        {hasAnyPermission(['reports.read', 'clients.read'])
          ? 'Any permission found'
          : 'Any permission missing'}
      </p>
    </>
  );
}

describe('usePermission', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { permissions: ['clients.read'] } });
  });

  it('checks a permission and any-permission list', () => {
    render(<PermissionProbe />);

    expect(screen.getByText('Permission found')).toBeInTheDocument();
    expect(screen.getByText('Any permission found')).toBeInTheDocument();
  });

  it('returns false for all checks without a user', () => {
    useAuth.mockReturnValue({ user: null });

    render(<PermissionProbe />);

    expect(screen.getByText('Permission missing')).toBeInTheDocument();
    expect(screen.getByText('Any permission missing')).toBeInTheDocument();
  });
});
