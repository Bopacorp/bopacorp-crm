import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { loginUser } from '@/test/auth-fixtures';
import { renderWithProviders } from '@/test/test-utils';
import RequireAuth from './RequireAuth.js';

describe('RequireAuth', () => {
  it('redirects to login when there is no authenticated session', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/privado"
          element={
            <RequireAuth>
              <p>Protected content</p>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<p>Sign in</p>} />
      </Routes>,
      { route: '/privado?origen=prueba' },
    );

    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders protected content for a stored authenticated user', () => {
    localStorage.setItem('bopacorp_user', JSON.stringify(loginUser));

    renderWithProviders(
      <Routes>
        <Route
          path="/private"
          element={
            <RequireAuth>
              <p>Protected content</p>
            </RequireAuth>
          }
        />
      </Routes>,
      { route: '/private' },
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
