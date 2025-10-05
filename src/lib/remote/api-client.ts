import axios, { isAxiosError } from "axios";
import { createClient } from "@/lib/supabase/client";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to include Supabase auth token
apiClient.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  console.log('[API Client] Session:', session ? 'Found' : 'Not found');
  console.log('[API Client] Access Token:', session?.access_token ? 'Present' : 'Missing');

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
    console.log('[API Client] Authorization header added');
  } else {
    console.warn('[API Client] No access token available');
  }

  return config;
});

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
