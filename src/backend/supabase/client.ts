import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ServiceClientConfig = {
  url: string;
  serviceRoleKey: string;
};

export const createServiceClient = ({
  url,
  serviceRoleKey,
}: ServiceClientConfig): SupabaseClient =>
  createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

export type AnonClientConfig = {
  url: string;
  anonKey: string;
  accessToken?: string;
};

export const createAnonClient = ({
  url,
  anonKey,
  accessToken,
}: AnonClientConfig): SupabaseClient => {
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });

  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });
  }

  return client;
};
