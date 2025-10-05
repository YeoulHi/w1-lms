export const enrollmentErrorCodes = {
  notPublished: 'ENROLLMENT_NOT_PUBLISHED',
  alreadyEnrolled: 'ENROLLMENT_ALREADY_ENROLLED',
  courseNotFound: 'ENROLLMENT_COURSE_NOT_FOUND',
  unauthorized: 'ENROLLMENT_UNAUTHORIZED',
  fetchError: 'ENROLLMENT_FETCH_ERROR',
  createError: 'ENROLLMENT_CREATE_ERROR',
  validationError: 'ENROLLMENT_VALIDATION_ERROR',
} as const;

type EnrollmentErrorValue =
  (typeof enrollmentErrorCodes)[keyof typeof enrollmentErrorCodes];

export type EnrollmentServiceError = EnrollmentErrorValue;
