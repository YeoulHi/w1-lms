import type { Hono } from 'hono';
import {
  failure,
  respond,
} from '@/backend/http/response';
import {
  getConfig,
  getLogger,
  type AppEnv,
} from '@/backend/hono/context';
import { createAnonClient } from '@/backend/supabase/client';
import { CreateCourseRequestSchema } from '@/features/courses/backend/schema';
import { coursesErrorCodes } from './error';
import { getGradesForCourse } from './grades.service';
import { createCourseService } from './service';

export const registerCoursesRoutes = (app: Hono<AppEnv>) => {
  app.post('/courses', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);

    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return respond(
        c,
        failure(
          401,
          coursesErrorCodes.unauthorized,
          'Authentication token is required.',
        ),
      );
    }

    const supabase = createAnonClient({
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      accessToken,
    });

    const { data: authResult, error: authError } = await supabase.auth.getUser();
    const user = authResult?.user;

    if (authError || !user) {
      return respond(
        c,
        failure(
          401,
          coursesErrorCodes.unauthorized,
          'Invalid authentication token.',
        ),
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('Failed to load instructor profile', profileError);

      return respond(
        c,
        failure(
          500,
          coursesErrorCodes.unauthorized,
          'Failed to load instructor profile.',
        ),
      );
    }

    if (profile.role !== 'instructor') {
      return respond(
        c,
        failure(
          403,
          coursesErrorCodes.unauthorized,
          'Only instructors can create courses.',
        ),
      );
    }

    const body = await c.req.json();
    const parsedBody = CreateCourseRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_BODY',
          'The provided course data is invalid.',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await createCourseService(
      supabase,
      user.id,
      parsedBody.data,
    );

    return respond(c, result);
  });

  app.get('/courses/:courseId/grades', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);
    const courseId = c.req.param('courseId');

    if (!courseId) {
      return respond(
        c,
        failure(400, 'COURSE_ID_REQUIRED', 'Course id is required.'),
      );
    }

    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Authentication token is required.'),
      );
    }

    const supabase = createAnonClient({
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      accessToken,
    });

    const { data: authResult, error: authError } = await supabase.auth.getUser();
    const user = authResult?.user;

    if (authError || !user) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Invalid authentication token.'),
      );
    }

    logger.info(`grades:list user=${user.id} course=${courseId}`);

    const result = await getGradesForCourse(supabase, courseId, user.id);

    return respond(c, result);
  });
};
