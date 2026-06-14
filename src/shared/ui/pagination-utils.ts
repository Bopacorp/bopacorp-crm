export type PageEntry = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };

export function buildPageNumbers(current: number, total: number): PageEntry[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => ({ type: 'page' as const, page: i + 1 }));
  }
  const entries: PageEntry[] = [{ type: 'page', page: 1 }];
  if (current > 3) entries.push({ type: 'ellipsis', key: 'start' });
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    entries.push({ type: 'page', page: i });
  }
  if (current < total - 2) entries.push({ type: 'ellipsis', key: 'end' });
  entries.push({ type: 'page', page: total });
  return entries;
}
