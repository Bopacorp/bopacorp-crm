import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, 'type'>
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-9', className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        className="absolute top-0 right-0 h-full px-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff className="size-4 text-muted-foreground" />
        ) : (
          <Eye className="size-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
