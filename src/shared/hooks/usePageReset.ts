import { useEffect, useRef } from 'react';

export function usePageReset(deps: unknown[], setPage: (page: number) => void): void {
  const prevRef = useRef(deps);

  useEffect(() => {
    const prev = prevRef.current;
    const changed = deps.some((dep, i) => dep !== prev[i]);
    prevRef.current = deps;
    if (changed) setPage(1);
  });
}
