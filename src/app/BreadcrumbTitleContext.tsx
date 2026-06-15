import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface BreadcrumbTitleContextValue {
  title: string | null;
  setTitle: (t: string | null) => void;
}

const BreadcrumbTitleContext = createContext<BreadcrumbTitleContextValue>({
  title: null,
  setTitle: () => {},
});

export function BreadcrumbTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return <BreadcrumbTitleContext value={{ title, setTitle }}>{children}</BreadcrumbTitleContext>;
}

export function useBreadcrumbTitle(title: string | null) {
  const { setTitle } = useContext(BreadcrumbTitleContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
}

export function useBreadcrumbTitleValue() {
  return useContext(BreadcrumbTitleContext).title;
}
