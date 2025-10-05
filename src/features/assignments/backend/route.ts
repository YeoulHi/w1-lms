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
import { publishAssignmentService } from './service';
import { submitAssignmentRequestSchema } from './submissions.schema';
import { submitAssignmentService } from './submissions.service';

export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
  app.patch('/assignments/:assignmentId/publish', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);
    const assignmentId = c.req.param('assignmentId');

    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'),
      );
    }

    const supabase = createAnonClient({
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      accessToken,
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error:', authError?.message || 'No user found');
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'),
      );
    }

    const result = await publishAssignmentService(
      supabase,
      assignmentId,
      user.id,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to publish assignment', {
        error: errorResult.error.code,
        message: errorResult.error.message,
      });
    }

    return respond(c, result);
  });

  app.post('/assignments/:assignmentId/submissions', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);
    const assignmentId = c.req.param('assignmentId');

    // Extract access token from Authorization header
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'),
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
