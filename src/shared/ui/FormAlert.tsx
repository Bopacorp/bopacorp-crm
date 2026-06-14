import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormAlertProps {
  message: string;
  variant?: 'destructive' | 'default';
}

export function FormAlert({ message, variant = 'destructive' }: FormAlertProps) {
  return (
    <Alert variant={variant}>
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
