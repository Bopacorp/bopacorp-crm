import { LoginRequestSchema } from '@bopacorp/shared/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { LOGIN_ERRORS } from '@/shared/errors/auth.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui/FormAlert';
import { ModeToggle } from '@/shared/ui/ModeToggle';
import { useAuth } from '../context/AuthContext.js';

type LoginFormValues = z.input<typeof LoginRequestSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [authError, setAuthError] = useState('');

  const from = (location.state as { from?: string })?.from ?? '/';

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError('');
    try {
      await login({ email: values.email, password: values.password });
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(getErrorMessage(err, LOGIN_ERRORS));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">BOPACORP</CardTitle>
          <CardDescription>{t('auth.login')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {authError && <FormAlert message={authError} />}

            <FieldGroup>
              <Field data-invalid={form.formState.errors.email ? true : undefined}>
                <FieldLabel htmlFor="email">{t('auth.email')}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={150}
                  disabled={form.formState.isSubmitting}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={form.formState.errors.password ? true : undefined}>
                <FieldLabel htmlFor="password">{t('auth.password')}</FieldLabel>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  disabled={form.formState.isSubmitting}
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <FieldError>{form.formState.errors.password.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                (form.formState.isSubmitted && !form.formState.isValid)
              }
              className="w-full"
            >
              {form.formState.isSubmitting && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {t('auth.login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
