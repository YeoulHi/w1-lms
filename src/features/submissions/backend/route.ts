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
import { gradeSubmissionRequestSchema } from './schema';
import { gradeSubmissionService, requestResubmissionService } from './service';

export const registerSubmissionsRoutes = (app: Hono<AppEnv>) => {
  // PATCH /submissions/:id - 과제 채점
  app.patch('/submissions/:id', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);
    const submissionId = c.req.param('id');

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
    const parsedBody = gradeSubmissionRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REQUEST_BODY',
          '채점 데이터가 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await gradeSubmissionService(
      supabase,
      submissionId,
      user.id,
      parsedBody.data,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to grade submission', {
        error: errorResult.error.code,
        message: errorResult.error.message,
      });
    }

    return respond(c, result);
  });

  // PATCH /submissions/:id/request-resubmission - 재제출 요청
  app.patch('/submissions/:id/request-resubmission', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);
    const submissionId = c.req.param('id');

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

    const result = await requestResubmissionService(
      supabase,
      submissionId,
      user.id,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to request resubmission', {
        error: errorResult.error.code,
        message: errorResult.error.message,
      });
    }

    return respond(c, result);
  });
};
