import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import RequireAuth from './RequireAuth.js';

describe('RequireAuth', () => {
  it('redirige al login cuando no hay una sesión autenticada', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/privado"
          element={
            <RequireAuth>
              <p>Contenido protegido</p>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<p>Inicio de sesión</p>} />
      </Routes>,
      { route: '/privado?origen=prueba' },
    );

    expect(screen.getByText('Inicio de sesión')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });
});
