import type { SupabaseClient } from '@supabase/supabase-js';
import type { HandlerResult } from '@/backend/http/response';
import { failure, success } from '@/backend/http/response';
import {
  gradeSubmissionResponseSchema,
  type GradeSubmissionRequest,
  type GradeSubmissionResponse,
} from './schema';

type GradingErrorCode =
  | 'SUBMISSION_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'ALREADY_GRADED'
  | 'INVALID_STATUS'
  | 'INTERNAL_ERROR';

export async function gradeSubmissionService(
  supabase: SupabaseClient,
  submissionId: string,
  instructorId: string,
  data: GradeSubmissionRequest,
): Promise<HandlerResult<GradeSubmissionResponse, GradingErrorCode>> {
  // 1. 제출물 정보 조회 (과제와 코스 정보 포함)
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select(`
      *,
      assignment:assignments!inner(
        id,
        course_id,
        courses!inner(
          instructor_id
        )
      )
    `)
    .eq('id', submissionId)
    .single();

  if (submissionError || !submission) {
    return failure(404, 'SUBMISSION_NOT_FOUND', '제출물을 찾을 수 없습니다.');
  }

  // 2. 권한 확인: 해당 코스를 소유한 강사인지 확인
  const courseInstructorId = submission.assignment.courses.instructor_id;
  if (courseInstructorId !== instructorId) {
    return failure(403, 'UNAUTHORIZED', '해당 제출물을 채점할 권한이 없습니다.');
  }

  // 3. 이미 채점된 과제인지 확인 (단순성 원칙: 재채점 불가)
  if (submission.status === 'graded') {
    return failure(409, 'ALREADY_GRADED', '이미 채점이 완료된 과제입니다.');
  }

  // 4. 제출물 업데이트
  const now = new Date().toISOString();
  const { data: updatedSubmission, error: updateError } = await supabase
    .from('submissions')
    .update({
      score: data.score,
      feedback: data.feedback,
      status: 'graded',
      updated_at: now,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (updateError || !updatedSubmission) {
    return failure(500, 'INTERNAL_ERROR', '채점 중 오류가 발생했습니다.');
  }

  // 5. 응답 데이터 검증
  const validationResult = gradeSubmissionResponseSchema.safeParse(updatedSubmission);

  if (!validationResult.success) {
    return failure(500, 'INTERNAL_ERROR', '응답 데이터 검증 실패');
  }

  return success(validationResult.data, 200);
}

export async function requestResubmissionService(
  supabase: SupabaseClient,
  submissionId: string,
  instructorId: string,
): Promise<HandlerResult<GradeSubmissionResponse, GradingErrorCode>> {
  // 1. 제출물 정보 조회 (과제와 코스 정보 포함)
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select(`
      *,
      assignment:assignments!inner(
        id,
        course_id,
        courses!inner(
          instructor_id
        )
      )
    `)
    .eq('id', submissionId)
    .single();

  if (submissionError || !submission) {
    return failure(404, 'SUBMISSION_NOT_FOUND', '제출물을 찾을 수 없습니다.');
  }

  // 2. 권한 확인: 해당 코스를 소유한 강사인지 확인
  const courseInstructorId = submission.assignment.courses.instructor_id;
  if (courseInstructorId !== instructorId) {
    return failure(403, 'UNAUTHORIZED', '해당 제출물을 관리할 권한이 없습니다.');
  }

  // 3. 제출물 상태 업데이트
  const now = new Date().toISOString();
  const { data: updatedSubmission, error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'resubmission_required',
      updated_at: now,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (updateError || !updatedSubmission) {
    return failure(500, 'INTERNAL_ERROR', '재제출 요청 중 오류가 발생했습니다.');
  }

  // 4. 응답 데이터 검증
  const validationResult = gradeSubmissionResponseSchema.safeParse(updatedSubmission);

  if (!validationResult.success) {
    return failure(500, 'INTERNAL_ERROR', '응답 데이터 검증 실패');
  }

  return success(validationResult.data, 200);
}
