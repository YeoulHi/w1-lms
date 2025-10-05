import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { HandlerResult } from '@/backend/http/response';
import { failure, success } from '@/backend/http/response';
import {
  ASSIGNMENT_STATUS,
  assignmentRowSchema,
  publishAssignmentResponseSchema,
  type PublishAssignmentResponse,
} from './schema';

type PublishAssignmentErrorCode =
  | 'ASSIGNMENT_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INVALID_STATUS'
  | 'INTERNAL_ERROR';

const assignmentWithCourseSchema = assignmentRowSchema.extend({
  courses: z.object({
    instructor_id: z.string().uuid(),
  }),
});

export async function publishAssignmentService(
  supabase: SupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<
  HandlerResult<PublishAssignmentResponse, PublishAssignmentErrorCode>
> {
  const { data: assignmentRaw, error: assignmentError } = await supabase
    .from('assignments')
    .select(
      `
        id,
        course_id,
        title,
        description,
        due_date,
        weight,
        late_submission_allowed,
        resubmission_allowed,
        status,
        created_at,
        updated_at,
        courses!assignments_course_id_fkey(
          instructor_id
        )
      `,
    )
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignmentRaw) {
    return failure(404, 'ASSIGNMENT_NOT_FOUND', '과제를 찾을 수 없습니다.');
  }

  const assignmentParse = assignmentWithCourseSchema.safeParse(assignmentRaw);

  if (!assignmentParse.success) {
    return failure(500, 'INTERNAL_ERROR', '과제 정보를 확인할 수 없습니다.');
  }

  const assignment = assignmentParse.data;

  if (assignment.courses.instructor_id !== instructorId) {
    return failure(403, 'UNAUTHORIZED', '해당 과제를 게시할 권한이 없습니다.');
  }

  if (assignment.status !== ASSIGNMENT_STATUS.DRAFT) {
    return failure(409, 'INVALID_STATUS', '이미 처리된 과제입니다.');
  }

  const now = new Date().toISOString();

  const { data: updatedAssignment, error: updateError } = await supabase
    .from('assignments')
    .update({
      status: ASSIGNMENT_STATUS.PUBLISHED,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .select(
      `
        id,
        course_id,
        title,
        description,
        due_date,
        weight,
        late_submission_allowed,
        resubmission_allowed,
        status,
        created_at,
        updated_at
      `,
    )
    .single();

  if (updateError || !updatedAssignment) {
    return failure(500, 'INTERNAL_ERROR', '과제 게시 중 오류가 발생했습니다.');
  }

  const responseParse = publishAssignmentResponseSchema.safeParse(
    updatedAssignment,
  );

  if (!responseParse.success) {
    return failure(500, 'INTERNAL_ERROR', '응답 데이터 검증에 실패했습니다.');
  }

  return success(responseParse.data);
}
