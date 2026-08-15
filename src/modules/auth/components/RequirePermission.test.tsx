import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequirePermission } from './RequirePermission.js';

const useAuth = vi.hoisted(() => vi.fn());
const usePermission = vi.hoisted(() => vi.fn());

vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth }));
vi.mock('@/modules/auth/hooks/usePermission.js', () => ({ usePermission }));

describe('RequirePermission', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ hasRole: (role: string) => role === 'manager' });
  });

  it('renders content with an authorized permission and role', () => {
    usePermission.mockReturnValue({ hasPermission: () => true });

    render(
      <MemoryRouter initialEntries={['/equipo']}>
        <Routes>
          <Route
            path="/equipo"
            element={
              <RequirePermission permission="employees.read" roles={['manager']}>
                <p>Authorized team</p>
              </RequirePermission>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Authorized team')).toBeInTheDocument();
  });

  it('redirects home when the permission is missing', () => {
    usePermission.mockReturnValue({ hasPermission: () => false });

    render(
      <MemoryRouter initialEntries={['/equipo']}>
        <Routes>
          <Route
            path="/equipo"
            element={
              <RequirePermission permission="employees.read">
                <p>Authorized team</p>
              </RequirePermission>
            }
          />
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Authorized team')).not.toBeInTheDocument();
  });

  it('redirects to the home page when the permission exists but the role is missing', () => {
    usePermission.mockReturnValue({ hasPermission: () => true });
    useAuth.mockReturnValue({ hasRole: () => false });

    render(
      <MemoryRouter initialEntries={['/team']}>
        <Routes>
          <Route
            path="/team"
            element={
              <RequirePermission permission="employees.read" roles={['manager']}>
                <p>Authorized team</p>
              </RequirePermission>
            }
          />
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Authorized team')).not.toBeInTheDocument();
  });
});
