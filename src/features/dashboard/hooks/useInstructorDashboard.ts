'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { InstructorDashboardResponse } from '@/features/dashboard/lib/dto';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

const fetchInstructorDashboard = async (
  token: string
): Promise<InstructorDashboardResponse> => {
  try {
    const { data } = await apiClient.get('/api/dashboard/instructor', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      'Failed to fetch instructor dashboard.'
    );
    throw new Error(message);
  }
};

export const useInstructorDashboard = () => {
  const { session } = useCurrentUser();

  return useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: () => fetchInstructorDashboard(session?.access_token ?? ''),
    enabled: Boolean(session?.access_token),
    staleTime: 1000 * 60,
  });
};
