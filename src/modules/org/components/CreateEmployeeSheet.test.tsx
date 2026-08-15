import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employee, employeeListItem, orgRole } from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  createEmployee: vi.fn(),
  assignSupervisors: vi.fn(),
  listOrgRoles: vi.fn(),
  listEmployees: vi.fn(),
  useRoles: vi.fn(),
  onOpenChange: vi.fn(),
  selectOnChange: vi.fn(),
  accessRoleOnChange: vi.fn(),
  selectCallCount: 0,
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('../hooks/useRoles.js', () => ({ useRoles: mocks.useRoles }));
vi.mock('../org.service.js', () => ({
  createEmployee: mocks.createEmployee,
  assignSupervisors: mocks.assignSupervisors,
  listOrgRoles: mocks.listOrgRoles,
  listEmployees: mocks.listEmployees,
}));
vi.mock('../users.service.js', () => ({ createUser: mocks.createUser }));
vi.mock('@/shared/hooks/useUnsavedGuard.js', () => ({
  useUnsavedGuard: () => ({
    dirtyRef: { current: false },
    showDiscard: false,
    handleDirtyChange: vi.fn(),
    guardedAction: vi.fn(),
    handleDiscard: vi.fn(),
    cancelDiscard: vi.fn(),
  }),
}));
vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock('@/components/ui/field.js', () => ({
  Field: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/input.js', () => ({
  Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock('@/components/ui/select.js', () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: ReactNode;
    onValueChange: (value: string) => void;
  }) => {
    if (mocks.selectCallCount % 2 === 0) {
      mocks.accessRoleOnChange.mockImplementation(onValueChange);
    } else {
      mocks.selectOnChange.mockImplementation(onValueChange);
    }
    mocks.selectCallCount += 1;
    return <div>{children}</div>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({
    children,
    value,
    disabled,
  }: {
    children: ReactNode;
    value: string;
    disabled?: boolean;
  }) => {
    const handleClick = () => {
      if (value === '00000000-0000-4000-8000-000000001025') {
        mocks.accessRoleOnChange(value);
      } else {
        mocks.selectOnChange(value);
      }
    };
    return (
      <button type="button" role="option" disabled={disabled} onClick={handleClick}>
        {children}
      </button>
    );
  },
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));
vi.mock('@/components/ui/sheet.js', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
}));
vi.mock('@/components/ui/badge.js', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('lucide-react', () => ({
  Eye: () => <span />,
  EyeOff: () => <span />,
  Loader2: () => <span />,
  X: () => <span />,
}));
vi.mock('@/shared/ui', () => ({
  DiscardChangesDialog: () => null,
  FormAlert: ({ message }: { message: string }) => <div role="alert">{message}</div>,
  SearchSelect: ({
    options,
    onValueChange,
    placeholder,
  }: {
    options: Array<{ value: string; label: string }>;
    onValueChange: (value: string) => void;
    placeholder: string;
  }) => (
    <button type="button" onClick={() => options[0] && onValueChange(options[0].value)}>
      {placeholder}
    </button>
  ),
}));

import { CreateEmployeeSheet } from './CreateEmployeeSheet.js';

const supervisorId = '00000000-0000-4000-8000-000000001023';
const supervisor = {
  ...employeeListItem,
  userId: supervisorId,
  user: { ...employeeListItem.user, id: supervisorId, firstName: 'Sam', lastName: 'Supervisor' },
  orgRole: { id: '00000000-0000-4000-8000-000000001024', name: 'Supervisor' },
};

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateEmployeeSheet open onOpenChange={mocks.onOpenChange} />
    </QueryClientProvider>,
  );
}

describe('CreateEmployeeSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectCallCount = 0;
    mocks.useRoles.mockReturnValue({
      roles: [{ id: '00000000-0000-4000-8000-000000001025', name: 'Manager' }],
    });
    mocks.listOrgRoles.mockResolvedValue({ data: [orgRole], meta: undefined });
    mocks.listEmployees.mockResolvedValue({ data: [supervisor], meta: undefined });
    mocks.createUser.mockResolvedValue({ id: employee.userId });
    mocks.createEmployee.mockResolvedValue(employee);
    mocks.assignSupervisors.mockResolvedValue(undefined);
  });

  it('creates an advisor account, employee record, and supervisor assignment', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByPlaceholderText('org.usernamePlaceholder'), 'new.advisor');
    await user.type(
      screen.getByPlaceholderText('org.emailPlaceholder'),
      'new.advisor@example.test',
    );
    await user.type(screen.getByPlaceholderText('org.passwordPlaceholder'), 'ValidPass1!');
    await user.click(screen.getByRole('option', { name: 'Manager' }));
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[2], 'Alex');
    await user.type(inputs[4], 'Advisor');
    await user.type(inputs[6], '0912345678');

    await user.click(screen.getByRole('option', { name: /Advisor/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'org.selectSupervisor' })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'org.selectSupervisor' }));
    await user.click(screen.getByRole('button', { name: 'org.createMember' }));

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledOnce());
    expect(mocks.createEmployee).toHaveBeenCalledWith({
      userId: employee.userId,
      orgRoleId: orgRole.id,
      territory: undefined,
      hiredAt: undefined,
      isActive: true,
    });
    expect(mocks.assignSupervisors).toHaveBeenCalledWith(employee.userId, {
      supervisorIds: [supervisorId],
    });
    expect(mocks.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not enable creation until required fields and roles are selected', () => {
    renderSheet();

    expect(screen.getByRole('button', { name: 'org.createMember' })).toBeDisabled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.assignSupervisors).not.toHaveBeenCalled();
  });
});
