import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { assignmentStatusSchema } from '@/features/assignments/backend/schema';
import type { HandlerResult } from '@/backend/http/response';
import { failure, success } from '@/backend/http/response';
import {
  assignmentSubmissionsResponseSchema,
  gradeSubmissionResponseSchema,
  submissionStatusSchema,
  type AssignmentSubmissionsResponse,
  type GradeSubmissionRequest,
  type GradeSubmissionResponse,
} from './schema';

type GradingErrorCode =
  | 'SUBMISSION_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'ALREADY_GRADED'
  | 'INVALID_STATUS'
  | 'INTERNAL_ERROR';

type AssignmentSubmissionsErrorCode =
  | 'ASSIGNMENT_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

const assignmentWithCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  course_id: z.string().uuid(),
  status: assignmentStatusSchema,
  courses: z.object({
    instructor_id: z.string().uuid(),
  }),
});

const submissionWithProfileSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  submitted_at: z.string(),
  status: submissionStatusSchema,
  score: z.number().nullable(),
  is_late: z.boolean(),
  feedback: z.string().nullable(),
  profiles: z.object({
    name: z.string(),
  }),
});

type SubmissionWithProfile = z.infer<typeof submissionWithProfileSchema>;

export async function getAssignmentSubmissionsService(
  supabase: SupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<
  HandlerResult<AssignmentSubmissionsResponse, AssignmentSubmissionsErrorCode>
> {
  const { data: assignmentRaw, error: assignmentError } = await supabase
    .from('assignments')
    .select(
      `
        id,
        title,
        course_id,
        status,
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

  const assignmentParseResult = assignmentWithCourseSchema.safeParse(assignmentRaw);

  if (!assignmentParseResult.success) {
    return failure(500, 'INTERNAL_ERROR', '과제 정보를 확인할 수 없습니다.');
  }

  const assignment = assignmentParseResult.data;

  if (assignment.courses.instructor_id !== instructorId) {
    return failure(403, 'UNAUTHORIZED', '해당 과제를 조회할 권한이 없습니다.');
  }

  const { data: submissionsRaw, error: submissionsError } = await supabase
    .from('submissions')
    .select(
      `
        id,
        assignment_id,
        learner_id,
        submitted_at,
        status,
        score,
        is_late,
        feedback,
        profiles!submissions_learner_id_fkey(
          name
        )
      `,
    )
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  if (submissionsError) {
    return failure(500, 'INTERNAL_ERROR', '제출물 목록을 가져올 수 없습니다.');
  }

  const parsedSubmissionsResult = z
    .array(submissionWithProfileSchema)
    .safeParse(submissionsRaw ?? []);

  if (!parsedSubmissionsResult.success) {
    return failure(500, 'INTERNAL_ERROR', '제출물 데이터를 확인할 수 없습니다.');
  }

  const submissions = parsedSubmissionsResult.data;

  const response = {
    assignment: {
      id: assignment.id,
      title: assignment.title,
      course_id: assignment.course_id,
      status: assignment.status,
    },
    submissions: submissions.map((submission: SubmissionWithProfile) => ({
      id: submission.id,
      assignment_id: submission.assignment_id,
      learner_id: submission.learner_id,
      learner_name: submission.profiles.name,
      submitted_at: submission.submitted_at,
      status: submission.status,
      score: submission.score,
      is_late: submission.is_late,
      feedback: submission.feedback,
    })),
  } satisfies AssignmentSubmissionsResponse;

  const validation = assignmentSubmissionsResponseSchema.safeParse(response);

  if (!validation.success) {
    return failure(500, 'INTERNAL_ERROR', '응답 데이터 검증에 실패했습니다.');
  }

  return success(validation.data, 200);
}

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


