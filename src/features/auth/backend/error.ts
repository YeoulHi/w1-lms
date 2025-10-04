export const authErrorCodes = {
  emailConflict: 'EMAIL_CONFLICT',
  authCreationError: 'AUTH_CREATION_ERROR',
  profileCreationError: 'PROFILE_CREATION_ERROR',
  termsAgreementError: 'TERMS_AGREEMENT_ERROR',
  validationError: 'VALIDATION_ERROR',
} as const;

export type AuthServiceError = typeof authErrorCodes[keyof typeof authErrorCodes];
