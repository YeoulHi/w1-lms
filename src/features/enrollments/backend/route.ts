import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { EnrollmentRequestSchema } from '@/features/enrollments/backend/schema';
import { enrollInCourseService } from './service';
import {
  enrollmentErrorCodes,
  type EnrollmentServiceError,
} from './error';

export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  app.post('/enrollments', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get authenticated user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
