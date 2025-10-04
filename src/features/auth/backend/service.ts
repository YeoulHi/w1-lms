import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SignUpResponseSchema,
  type SignUpBody,
  type SignUpResponse,
} from '@/features/auth/backend/schema';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';

export const signUpService = async (
  client: SupabaseClient,
  body: SignUpBody,
): Promise<HandlerResult<SignUpResponse, AuthServiceError, unknown>> => {
  // Create auth user
  const { data: authData, error: authError } = await client.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });

  if (authError) {
    // Check if email already exists
    if (authError.message.includes('already') || authError.message.includes('duplicate')) {
      return failure(409, authErrorCodes.emailConflict, 'Email already in use.');
    }
    return failure(500, authErrorCodes.authCreationError, authError.message);
  }

  if (!authData.user) {
    return failure(500, authErrorCodes.authCreationError, 'Failed to create auth user.');
  }

  const userId = authData.user.id;

  // Create profile
  const { error: profileError } = await client
    .from('profiles')
    .insert({
      id: userId,
      role: body.role,
      name: body.name,
      phone_number: body.phoneNumber ?? null,
    });

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await client.auth.admin.deleteUser(userId);
    return failure(500, authErrorCodes.profileCreationError, profileError.message);
  }

  // Create terms agreement record
  const { error: termsError } = await client
    .from('term_agreements')
    .insert({
      user_id: userId,
      terms_version: body.termsVersion,
    });

  if (termsError) {
    // Rollback: delete profile and auth user
    await client.from('profiles').delete().eq('id', userId);
    await client.auth.admin.deleteUser(userId);
    return failure(500, authErrorCodes.termsAgreementError, termsError.message);
  }

  // Validate response
  const response: SignUpResponse = {
    userId,
    email: body.email,
    role: body.role,
  };

  const parsed = SignUpResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      authErrorCodes.validationError,
      'Signup response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data, 201);
};
