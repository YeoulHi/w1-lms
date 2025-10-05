import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  CourseTableRowSchema,
  EnrollmentResponseSchema,
  EnrollmentTableRowSchema,
  type EnrollmentResponse,
} from '@/features/enrollments/backend/schema';
import {
  enrollmentErrorCodes,
  type EnrollmentServiceError,
} from '@/features/enrollments/backend/error';

const COURSES_TABLE = 'courses';
const ENROLLMENTS_TABLE = 'enrollments';

export const enrollInCourseService = async (
  client: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<
  HandlerResult<EnrollmentResponse, EnrollmentServiceError, unknown>
> => {
  // 1. Check if course exists and is published
  const { data: courseData, error: courseError } = await client
    .from(COURSES_TABLE)
    .select('id, status')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return failure(
      500,
      enrollmentErrorCodes.fetchError,
      courseError.message,
    );
  }

  if (!courseData) {
    return failure(
      404,
      enrollmentErrorCodes.courseNotFound,
      '존재하지 않는 코스입니다.',
    );
  }

  const courseParse = CourseTableRowSchema.safeParse(courseData);

  if (!courseParse.success) {
    return failure(
      500,
      enrollmentErrorCodes.validationError,
      'Course data validation failed.',
      courseParse.error.format(),
    );
  }

  if (courseParse.data.status !== 'published') {
    return failure(
      400,
      enrollmentErrorCodes.notPublished,
      '수강신청할 수 없는 코스입니다.',
    );
  }

  // 2. Check if already enrolled
  const { data: existingEnrollment, error: checkError } = await client
    .from(ENROLLMENTS_TABLE)
    .select('id')
    .eq('learner_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle();

  if (checkError) {
    return failure(
      500,
      enrollmentErrorCodes.fetchError,
      checkError.message,
    );
  }

  if (existingEnrollment) {
    return failure(
      409,
      enrollmentErrorCodes.alreadyEnrolled,
      '이미 수강 중인 코스입니다.',
    );
  }

  // 3. Create enrollment
  const { data: enrollmentData, error: createError } = await client
    .from(ENROLLMENTS_TABLE)
    .insert({
      learner_id: userId,
      course_id: courseId,
      status: 'active',
    })
    .select('id, course_id, learner_id, enrolled_at')
    .single();

  if (createError) {
    return failure(
      500,
      enrollmentErrorCodes.createError,
      createError.message,
    );
  }

  if (!enrollmentData) {
    return failure(
      500,
      enrollmentErrorCodes.createError,
      'Failed to create enrollment.',
    );
  }

  const enrollmentParse = EnrollmentTableRowSchema.safeParse(enrollmentData);

  if (!enrollmentParse.success) {
    return failure(
      500,
      enrollmentErrorCodes.validationError,
      'Enrollment data validation failed.',
      enrollmentParse.error.format(),
    );
  }

  const mapped: EnrollmentResponse = {
    id: enrollmentParse.data.id,
    courseId: enrollmentParse.data.course_id,
    learnerId: enrollmentParse.data.learner_id,
    enrolledAt: enrollmentParse.data.enrolled_at,
  };

  const responseParse = EnrollmentResponseSchema.safeParse(mapped);

  if (!responseParse.success) {
    return failure(
      500,
      enrollmentErrorCodes.validationError,
      'Enrollment response validation failed.',
      responseParse.error.format(),
    );
  }

  return success(responseParse.data, 201);
};
