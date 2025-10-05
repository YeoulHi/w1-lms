export const coursesErrorCodes = {
  courseCreationError: 'COURSE_CREATION_ERROR',
  validationError: 'VALIDATION_ERROR',
  unauthorized: 'UNAUTHORIZED',
} as const;

export type CoursesServiceError = typeof coursesErrorCodes[keyof typeof coursesErrorCodes];
