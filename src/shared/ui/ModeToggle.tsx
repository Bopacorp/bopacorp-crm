import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const themes = ['light', 'dark', 'system'] as const;
const themeKeys: Record<string, string> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
};
const icons: Record<string, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ModeToggle() {
  const { theme = 'system', setTheme } = useTheme();
  const { t } = useTranslation();

  const cycle = () => {
    const idx = themes.indexOf(theme as (typeof themes)[number]);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const Icon = icons[theme] ?? Monitor;
  const label = t(themeKeys[theme] ?? 'theme.system');

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
