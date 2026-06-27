import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { listAdvisors } from '@/modules/org/org.service.js';

interface AdvisorOption {
  value: string;
  label: string;
}

function advisorName(profile: { firstName: string; lastName: string } | null, username: string) {
  return profile ? `${profile.firstName} ${profile.lastName}` : username;
}

export function useTeamAdvisors() {
  const { user, hasRole } = useAuth();
  const isSupervisor = hasRole('supervisor') && !hasRole('admin') && !hasRole('manager');

  const { advisors: allAdvisors, loading: allLoading } = useAdvisors();

  const teamQuery = useQuery({
    queryKey: queryKeys.employees.advisors(user?.id ?? ''),
    queryFn: () => listAdvisors(user?.id ?? '', { page: 1, limit: 100, sortOrder: 'asc' }),
    enabled: isSupervisor && !!user?.id,
    staleTime: 5 * 60_000,
  });

  const advisorOptions = useMemo<AdvisorOption[]>(() => {
    if (isSupervisor) {
      return (teamQuery.data?.data ?? [])
        .map((rel) => ({
          value: rel.advisor.id,
          label: advisorName(rel.advisor.profile, rel.advisor.username),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return allAdvisors
      .map((emp) => ({
        value: emp.userId,
        label: advisorName(
          emp.user.firstName && emp.user.lastName
            ? { firstName: emp.user.firstName, lastName: emp.user.lastName }
            : null,
          emp.user.username,
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [isSupervisor, teamQuery.data, allAdvisors]);

  const loading = isSupervisor ? teamQuery.isLoading : allLoading;

  return { advisorOptions, loading, isSupervisor };
}
