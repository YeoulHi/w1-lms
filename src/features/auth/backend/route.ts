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
import { SignUpBodySchema } from '@/features/auth/backend/schema';
import { signUpService } from './service';
import {
  authErrorCodes,
  type AuthServiceError,
} from './error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/auth/signup', async (c) => {
    const body = await c.req.json();
    const parsedBody = SignUpBodySchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_SIGNUP_BODY',
          'The provided signup data is invalid.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await signUpService(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthServiceError, unknown>;

      if (errorResult.error.code === authErrorCodes.authCreationError) {
        logger.error('Failed to create auth user', errorResult.error.message);
      }

      if (errorResult.error.code === authErrorCodes.profileCreationError) {
        logger.error('Failed to create user profile', errorResult.error.message);
      }

      if (errorResult.error.code === authErrorCodes.termsAgreementError) {
        logger.error('Failed to create terms agreement', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
