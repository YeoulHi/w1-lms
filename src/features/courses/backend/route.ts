import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getConfig,
  getLogger,
  type AppEnv,
} from '@/backend/hono/context';
import { createAnonClient } from '@/backend/supabase/client';
import { CreateCourseRequestSchema } from '@/features/courses/backend/schema';
import { createCourseService } from './service';
import {
  coursesErrorCodes,
  type CoursesServiceError,
} from './error';

export const registerCoursesRoutes = (app: Hono<AppEnv>) => {
  app.post('/courses', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);

    // Extract access token from Authorization header
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    logger.info('[Courses] Authorization header:', authHeader ? 'Present' : 'Missing');
    logger.info('[Courses] Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'Missing');

    if (!accessToken) {
      return respond(
        c,
        failure(
          401,
          coursesErrorCodes.unauthorized,
          '인증 토큰이 필요합니다.',
        ),
      );
    }

    // Create anon client with user's access token
    const supabase = createAnonClient({
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      accessToken,
    });

    // Get authenticated user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    logger.info('[Courses] Auth result:', { user: user ? user.id : null, error: authError?.message });

    if (authError || !user) {
      logger.error('[Courses] Authentication failed:', authError?.message || 'No user');
      return respond(
        c,
        failure(
          401,
          coursesErrorCodes.unauthorized,
          '인증되지 않은 사용자입니다.',
        ),
      );
    }

    logger.info('[Courses] User authenticated:', user.id);

    // Check if user is an instructor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('Failed to fetch user profile', profileError?.message);
      return respond(
        c,
        failure(
          500,
          coursesErrorCodes.unauthorized,
          '사용자 프로필을 확인할 수 없습니다.',
        ),
      );
    }

    logger.info('[Courses] User role:', profile.role);

    if (profile.role !== 'instructor') {
      return respond(
        c,
        failure(
          403,
          coursesErrorCodes.unauthorized,
          '강사만 강의를 생성할 수 있습니다.',
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

    if (!result.ok) {
      const errorResult = result as ErrorResult<CoursesServiceError, unknown>;

      if (errorResult.error.code === coursesErrorCodes.courseCreationError) {
        logger.error('Failed to create course', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('[Courses] Course created successfully');
    return respond(c, result);
  });
};
