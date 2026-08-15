import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Can } from './Can.js';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  usePermission: vi.fn(),
}));

vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/modules/auth/hooks/usePermission.js', () => ({ usePermission: mocks.usePermission }));

describe('Can', () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ hasRole: (role: string) => role === 'manager' });
    mocks.usePermission.mockReturnValue({
      hasPermission: (permission: string) => permission === 'clients.read',
      hasAnyPermission: (permissions: string[]) => permissions.includes('clients.read'),
    });
  });

  it('renders children when the required permission is available', () => {
    render(
      <Can permission="clients.read">
        <p>Protected action</p>
      </Can>,
    );

    expect(screen.getByText('Protected action')).toBeInTheDocument();
  });

  it('hides children when the required permission is missing', () => {
    mocks.usePermission.mockReturnValue({
      hasPermission: () => false,
      hasAnyPermission: () => false,
    });

    render(
      <Can permission="clients.read">
        <p>Protected action</p>
      </Can>,
    );

    expect(screen.queryByText('Protected action')).not.toBeInTheDocument();
  });

  it('supports any-permission checks', () => {
    render(
      <Can any={['reports.read', 'clients.read']}>
        <p>Any permission action</p>
      </Can>,
    );

    expect(screen.getByText('Any permission action')).toBeInTheDocument();
  });

  it('hides children when no permission in the any-permission list is available', () => {
    mocks.usePermission.mockReturnValue({
      hasPermission: () => false,
      hasAnyPermission: () => false,
    });

    render(
      <Can any={['reports.read', 'clients.read']}>
        <p>Any permission action</p>
      </Can>,
    );

    expect(screen.queryByText('Any permission action')).not.toBeInTheDocument();
  });

  it('supports required roles', () => {
    render(
      <Can roles={['manager']}>
        <p>Management action</p>
      </Can>,
    );

    expect(screen.getByText('Management action')).toBeInTheDocument();
  });

  it('hides children when no required role is available', () => {
    mocks.useAuth.mockReturnValue({ hasRole: () => false });

    render(
      <Can roles={['manager']}>
        <p>Management action</p>
      </Can>,
    );

    expect(screen.queryByText('Management action')).not.toBeInTheDocument();
  });

  it('supports any-role checks', () => {
    render(
      <Can anyRole={['supervisor', 'manager']}>
        <p>Team action</p>
      </Can>,
    );

    expect(screen.getByText('Team action')).toBeInTheDocument();
  });

  it('hides children when no role in the any-role list is available', () => {
    mocks.useAuth.mockReturnValue({ hasRole: () => false });

    render(
      <Can anyRole={['supervisor', 'coordinator']}>
        <p>Team action</p>
      </Can>,
    );

    expect(screen.queryByText('Team action')).not.toBeInTheDocument();
  });
});
