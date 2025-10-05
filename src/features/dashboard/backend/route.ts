import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getConfig } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { getInstructorDashboard } from './service';
import { createAnonClient } from '@/backend/supabase/client';

export const dashboardRoutes = new Hono<AppEnv>();

// GET /api/dashboard/instructor
dashboardRoutes.get('/instructor', async (c) => {
  const config = getConfig(c);

  // Extract user token from Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const anonClient = createAnonClient({
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
    accessToken,
  });

  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser();

  if (authError || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Verify user is an instructor
  const supabase = c.get('supabase');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }

  if (profile.role !== 'instructor') {
    return c.json({ error: 'Access denied. Instructor role required.' }, 403);
  }

  // Fetch dashboard data
  const result = await getInstructorDashboard(supabase, user.id);
  return respond(c, result);
});
