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
import { submitAssignmentRequestSchema } from './submissions.schema';
import { submitAssignmentService } from './submissions.service';

export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
  app.post('/assignments/:assignmentId/submissions', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const assignmentId = c.req.param('assignmentId');

    // Get authenticated user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'),
      );
    }

    const body = await c.req.json();
    const parsedBody = submitAssignmentRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REQUEST_BODY',
          '제출 데이터가 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await submitAssignmentService(
      supabase,
      user.id,
      assignmentId,
      parsedBody.data,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to submit assignment', {
        error: errorResult.error.code,
        message: errorResult.error.message,
      });
    }

    return respond(c, result);
  });
};
