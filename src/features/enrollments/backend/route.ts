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
import { EnrollmentRequestSchema } from '@/features/enrollments/backend/schema';
import { enrollInCourseService } from './service';
import {
  enrollmentErrorCodes,
  type EnrollmentServiceError,
} from './error';

export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  app.post('/enrollments', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);

    // Extract access token from Authorization header
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return respond(
        c,
        failure(
          401,
          enrollmentErrorCodes.unauthorized,
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

    if (authError || !user) {
      logger.error('Auth error:', authError?.message || 'No user found');
      return respond(
        c,
        failure(
          401,
          enrollmentErrorCodes.unauthorized,
          '인증되지 않은 사용자입니다.',
        ),
      );
    }

    const body = await c.req.json();
    const parsedBody = EnrollmentRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ENROLLMENT_BODY',
          'The provided enrollment data is invalid.',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await enrollInCourseService(
      supabase,
      user.id,
      parsedBody.data.courseId,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<EnrollmentServiceError, unknown>;

      if (errorResult.error.code === enrollmentErrorCodes.fetchError) {
        logger.error('Failed to fetch course data', errorResult.error.message);
      }

      if (errorResult.error.code === enrollmentErrorCodes.createError) {
        logger.error('Failed to create enrollment', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
