import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '@/services/auth.service.js';
import { authTokens, loginResponse, loginUser, meResponse } from '@/test/auth-fixtures';
import { AuthProvider, useAuth } from './AuthContext.js';

vi.mock('@/services/auth.service.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  fetchMe: vi.fn(),
  buildAuthUser: vi.fn(),
}));

function AuthControls() {
  const { login, logout, user, hasPermission, hasRole } = useAuth();
  return (
    <>
      <p>{user?.email ?? 'No session'}</p>
      <p>{hasPermission('employees.read') ? 'Permission enabled' : 'Permission disabled'}</p>
      <p>{hasRole('manager') ? 'Manager role' : 'No manager role'}</p>
      <button
        type="button"
        onClick={() => login({ email: 'maria@bopacorp.test', password: 'secreto' })}
      >
        Sign in
      </button>
      <button type="button" onClick={() => logout()}>
        Sign out
      </button>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.buildAuthUser).mockReturnValue(loginUser);
  });

  it('stores the session on login and updates permissions and roles', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue(loginResponse);
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(authService.login).toHaveBeenCalledWith({
      email: 'maria@bopacorp.test',
      password: 'secreto',
    });
    expect(localStorage.getItem('bopacorp_access_token')).toBe(authTokens.accessToken);
    expect(localStorage.getItem('bopacorp_refresh_token')).toBe(authTokens.refreshToken);
    expect(localStorage.getItem('bopacorp_user')).toContain(loginUser.email);
    expect(screen.getByText(loginUser.email)).toBeInTheDocument();
    expect(screen.getByText('Permission enabled')).toBeInTheDocument();
    expect(screen.getByText('Manager role')).toBeInTheDocument();
  });

  it('clears local state on logout even when remote revocation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue(loginResponse);
    vi.mocked(authService.logout).mockRejectedValue(new Error('API no disponible'));

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(authService.logout).toHaveBeenCalledWith(authTokens.refreshToken);
    expect(localStorage.getItem('bopacorp_access_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_refresh_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_user')).toBeNull();
    expect(screen.getByText('No session')).toBeInTheDocument();
    expect(screen.getByText('Permission disabled')).toBeInTheDocument();
    expect(screen.getByText('No manager role')).toBeInTheDocument();
  });

  it('restores the session and refreshes the user from /auth/me', async () => {
    localStorage.setItem('bopacorp_access_token', authTokens.accessToken);
    localStorage.setItem('bopacorp_refresh_token', authTokens.refreshToken);
    localStorage.setItem('bopacorp_user', JSON.stringify(loginUser));
    vi.mocked(authService.fetchMe).mockResolvedValue(meResponse);

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await waitFor(() => expect(authService.fetchMe).toHaveBeenCalledTimes(1));
    expect(screen.getByText(loginUser.email)).toBeInTheDocument();
    expect(localStorage.getItem('bopacorp_user')).toContain(loginUser.email);
  });

  it('clears the session when /auth/me rejects the stored token', async () => {
    localStorage.setItem('bopacorp_access_token', authTokens.accessToken);
    localStorage.setItem('bopacorp_refresh_token', authTokens.refreshToken);
    localStorage.setItem('bopacorp_user', JSON.stringify(loginUser));
    vi.mocked(authService.fetchMe).mockRejectedValue(new Error('Invalid session'));

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('No session')).toBeInTheDocument());
    expect(localStorage.getItem('bopacorp_access_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_refresh_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_user')).toBeNull();
  });

  it('refreshes the user after receiving the token-refreshed event', async () => {
    vi.mocked(authService.fetchMe).mockResolvedValue(meResponse);

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    window.dispatchEvent(new Event('bopacorp:token-refreshed'));

    await waitFor(() => expect(authService.fetchMe).toHaveBeenCalledTimes(1));
    expect(screen.getByText(loginUser.email)).toBeInTheDocument();
  });
});
