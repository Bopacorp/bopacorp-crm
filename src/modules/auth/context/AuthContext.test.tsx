import type { LoginResponse } from '@bopacorp/shared/auth';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as authService from '@/services/auth.service.js';
import { AuthProvider, useAuth } from './AuthContext.js';

vi.mock('@/services/auth.service.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  fetchMe: vi.fn(),
  buildAuthUser: vi.fn(),
}));

const loginResponse: LoginResponse = {
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'maria',
    email: 'maria@bopacorp.test',
    roles: ['manager'],
    permissions: ['employees.read'],
    profile: null,
  },
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  },
};

function AuthControls() {
  const { login, logout, user } = useAuth();
  return (
    <>
      <p>{user?.email ?? 'Sin sesión'}</p>
      <button
        type="button"
        onClick={() => login({ email: 'maria@bopacorp.test', password: 'secreto' })}
      >
        Iniciar sesión
      </button>
      <button type="button" onClick={() => logout()}>
        Cerrar sesión
      </button>
    </>
  );
}

describe('AuthContext', () => {
  it('guarda la sesión al iniciar y limpia el estado local al cerrar', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue(loginResponse);
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(authService.login).toHaveBeenCalledWith({
      email: 'maria@bopacorp.test',
      password: 'secreto',
    });
    expect(localStorage.getItem('bopacorp_access_token')).toBe('access-token');
    expect(localStorage.getItem('bopacorp_refresh_token')).toBe('refresh-token');
    expect(localStorage.getItem('bopacorp_user')).toContain('maria@bopacorp.test');
    expect(screen.getByText('maria@bopacorp.test')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    expect(localStorage.getItem('bopacorp_access_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_refresh_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_user')).toBeNull();
    expect(screen.getByText('Sin sesión')).toBeInTheDocument();
  });
});
