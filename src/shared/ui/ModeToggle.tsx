import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const themes = ['light', 'dark', 'system'] as const;
const labels: Record<string, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
};
const icons: Record<string, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ModeToggle() {
  const { theme = 'system', setTheme } = useTheme();

  const cycle = () => {
    const idx = themes.indexOf(theme as (typeof themes)[number]);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const Icon = icons[theme] ?? Monitor;
  const label = labels[theme] ?? 'Sistema';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={cycle} className="size-8">
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
