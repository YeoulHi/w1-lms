import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  CreateCourseResponseSchema,
  CourseTableRowSchema,
  type CreateCourseRequest,
  type CreateCourseResponse,
  type CourseRow,
} from '@/features/courses/backend/schema';
import {
  coursesErrorCodes,
  type CoursesServiceError,
} from '@/features/courses/backend/error';

const COURSES_TABLE = 'courses';

export const createCourseService = async (
  client: SupabaseClient,
  instructorId: string,
  body: CreateCourseRequest,
): Promise<HandlerResult<CreateCourseResponse, CoursesServiceError, unknown>> => {
  // Create course
  const { data, error } = await client
    .from(COURSES_TABLE)
    .insert({
      instructor_id: instructorId,
      title: body.title,
      status: 'draft',
    })
    .select('id, title, instructor_id, status, created_at')
    .single<CourseRow>();

  if (error) {
    return failure(500, coursesErrorCodes.courseCreationError, error.message);
  }

  if (!data) {
    return failure(500, coursesErrorCodes.courseCreationError, 'Failed to create course.');
  }

  const rowParse = CourseTableRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = {
    id: rowParse.data.id,
    title: rowParse.data.title,
    instructorId: rowParse.data.instructor_id,
    status: rowParse.data.status,
    createdAt: rowParse.data.created_at,
  } satisfies CreateCourseResponse;

  const parsed = CreateCourseResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data, 201);
};
