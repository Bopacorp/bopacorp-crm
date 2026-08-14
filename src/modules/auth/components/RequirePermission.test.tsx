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

  it('renderiza el contenido con permiso y rol autorizados', () => {
    usePermission.mockReturnValue({ hasPermission: () => true });

    render(
      <MemoryRouter initialEntries={['/equipo']}>
        <Routes>
          <Route
            path="/equipo"
            element={
              <RequirePermission permission="employees.read" roles={['manager']}>
                <p>Equipo autorizado</p>
              </RequirePermission>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Equipo autorizado')).toBeInTheDocument();
  });

  it('redirige al inicio cuando falta el permiso', () => {
    usePermission.mockReturnValue({ hasPermission: () => false });

    render(
      <MemoryRouter initialEntries={['/equipo']}>
        <Routes>
          <Route
            path="/equipo"
            element={
              <RequirePermission permission="employees.read">
                <p>Equipo autorizado</p>
              </RequirePermission>
            }
          />
          <Route path="/" element={<p>Inicio</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Equipo autorizado')).not.toBeInTheDocument();
  });
});
