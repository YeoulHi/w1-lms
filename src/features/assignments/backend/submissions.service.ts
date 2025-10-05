import type { SupabaseClient } from '@supabase/supabase-js';
import type { HandlerResult } from '@/backend/http/response';
import { failure, success } from '@/backend/http/response';
import {
  submitAssignmentResponseSchema,
  type SubmitAssignmentRequest,
  type SubmitAssignmentResponse,
} from './submissions.schema';

type SubmissionErrorCode =
  | 'ASSIGNMENT_NOT_FOUND'
  | 'NOT_ENROLLED'
  | 'ASSIGNMENT_NOT_PUBLISHED'
  | 'DEADLINE_PASSED'
  | 'ALREADY_GRADED'
  | 'RESUBMISSION_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

export async function submitAssignmentService(
  supabase: SupabaseClient,
  userId: string,
  assignmentId: string,
  data: SubmitAssignmentRequest,
): Promise<HandlerResult<SubmitAssignmentResponse, SubmissionErrorCode>> {
  // 1. 과제 정보 조회
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*, course_id, due_date, late_submission_allowed, resubmission_allowed, status')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(404, 'ASSIGNMENT_NOT_FOUND', '과제를 찾을 수 없습니다.');
  }

  // 2. 과제 상태 확인 (published만 제출 가능)
  if (assignment.status !== 'published') {
    return failure(403, 'ASSIGNMENT_NOT_PUBLISHED', '게시되지 않은 과제입니다.');
  }

  // 3. 수강 여부 확인
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', assignment.course_id)
    .eq('learner_id', userId)
    .eq('status', 'active')
    .single();

  if (!enrollment) {
    return failure(403, 'NOT_ENROLLED', '수강하지 않은 강의의 과제입니다.');
  }

  // 4. 기존 제출물 확인
  const { data: existingSubmission } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('learner_id', userId)
    .single();

  // 5. 채점 완료된 경우 재제출 불가
  if (existingSubmission?.status === 'graded') {
    return failure(403, 'ALREADY_GRADED', '이미 채점이 완료된 과제입니다.');
  }

  // 6. 지각 여부 판단
  const now = new Date();
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
  const isLate = dueDate ? now > dueDate : false;

  // 7. 마감일 이후 제출 정책 검증
  if (isLate && !assignment.late_submission_allowed) {
    return failure(403, 'DEADLINE_PASSED', '마감된 과제입니다.');
  }

  // 8. 재제출 정책 검증
  if (existingSubmission) {
    const isResubmissionRequested = existingSubmission.status === 'resubmission_required';

    if (!assignment.resubmission_allowed && !isResubmissionRequested) {
      return failure(403, 'RESUBMISSION_NOT_ALLOWED', '재제출이 허용되지 않는 과제입니다.');
    }
  }

  // 9. 제출물 저장 (upsert)
  const submissionData = {
    assignment_id: assignmentId,
    learner_id: userId,
    content_text: data.content,
    content_link: data.link || null,
    status: 'submitted' as const,
    is_late: isLate,
    submitted_at: now.toISOString(),
  };

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .upsert(
      {
        ...submissionData,
        updated_at: now.toISOString(),
      },
      {
        onConflict: 'assignment_id,learner_id',
      },
    )
    .select()
    .single();

  if (submissionError || !submission) {
    return failure(500, 'INTERNAL_ERROR', '제출 중 오류가 발생했습니다.');
  }

  // 10. 응답 데이터 검증
  const validationResult = submitAssignmentResponseSchema.safeParse(submission);

  if (!validationResult.success) {
    return failure(500, 'INTERNAL_ERROR', '응답 데이터 검증 실패');
  }

  return success(validationResult.data, 201);
}
