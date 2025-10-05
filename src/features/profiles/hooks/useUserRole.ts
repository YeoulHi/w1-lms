'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

const fetchUserRole = async (userId: string): Promise<string | null> => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { role: string }).role;
};

export const useUserRole = () => {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: () => fetchUserRole(user?.id ?? ''),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
