"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  CurrentUserContextValue,
  CurrentUserSnapshot,
} from "../types";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  children: ReactNode;
  initialState: CurrentUserSnapshot;
};

export const CurrentUserProvider = ({
  children,
  initialState,
}: CurrentUserProviderProps) => {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState<CurrentUserSnapshot>(initialState);

  const refresh = useCallback(async () => {
    setSnapshot((prev) => ({ status: "loading", user: prev.user, session: prev.session }));
    const supabase = getSupabaseBrowserClient();

    try {
      const [userResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      const nextSnapshot = match(userResult)
        .with({ data: { user: P.nonNullable } }, ({ data }) => ({
          status: "authenticated" as const,
          user: {
            id: data.user.id,
            email: data.user.email,
            appMetadata: data.user.app_metadata ?? {},
            userMetadata: data.user.user_metadata ?? {},
          },
          session: sessionResult.data.session,
        }))
        .otherwise(() => ({ status: "unauthenticated" as const, user: null, session: null }));

      setSnapshot(nextSnapshot);
      queryClient.setQueryData(["currentUser"], nextSnapshot);
    } catch (error) {
      const fallbackSnapshot: CurrentUserSnapshot = {
        status: "unauthenticated",
        user: null,
        session: null,
      };
      setSnapshot(fallbackSnapshot);
      queryClient.setQueryData(["currentUser"], fallbackSnapshot);
    }
  }, [queryClient]);

  const value = useMemo<CurrentUserContextValue>(() => {
    return {
      ...snapshot,
      refresh,
      isAuthenticated: snapshot.status === "authenticated",
      isLoading: snapshot.status === "loading",
    };
  }, [refresh, snapshot]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserContext = () => {
  const value = useContext(CurrentUserContext);

  if (!value) {
    throw new Error("CurrentUserProvider가 트리 상단에 필요합니다.");
  }

  return value;
};
