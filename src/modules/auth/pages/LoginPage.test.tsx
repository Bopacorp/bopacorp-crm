import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import i18n from '@/i18n/index.js';
import { ApiError } from '@/services/api.js';
import LoginPage from './LoginPage.js';

const login = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext.js', () => ({
  useAuth: () => ({ login }),
}));

describe('LoginPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  afterEach(async () => {
    await i18n.changeLanguage('es');
  });

  function renderPage() {
    return import('@testing-library/react').then(({ render }) =>
      render(
        <TooltipProvider>
          <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/dashboard' } }]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<p>Dashboard</p>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>,
      ),
    );
  }

  async function fillForm() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email address'), 'maria@bopacorp.com');
    await user.type(screen.getByLabelText('Password'), 'Valid-password1!');
    return user;
  }

  it('shows the translated error for invalid credentials', async () => {
    login.mockRejectedValue(new ApiError('INVALID_CREDENTIALS', 'Invalid credentials'));
    await renderPage();
    const user = await fillForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByLabelText('Email address')).toBeEnabled();
  });

  it('shows the account-locked message when the user is blocked', async () => {
    login.mockRejectedValue(new ApiError('ACCOUNT_LOCKED', 'Account locked'));
    await renderPage();
    const user = await fillForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your account has been temporarily locked. Try again later.',
    );
  });

  it('navigates to the original destination after a successful login', async () => {
    login.mockResolvedValue(undefined);
    await renderPage();
    const user = await fillForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith({
      email: 'maria@bopacorp.com',
      password: 'Valid-password1!',
    });
  });
});
