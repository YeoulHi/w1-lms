import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot } from "../types";

const mapUser = (user: User) => ({
  id: user.id,
  email: user.email,
  appMetadata: user.app_metadata ?? {},
  userMetadata: user.user_metadata ?? {},
});

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const [userResult, sessionResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  const user = userResult.data.user;

  if (user) {
    return {
      status: "authenticated",
      user: mapUser(user),
      session: sessionResult.data.session,
    };
  }

  return { status: "unauthenticated", user: null, session: null };
};
