import { SupabaseClient } from '@supabase/supabase-js';
import { failure, HandlerResult, success } from '@/backend/http/response';
import {
  GradesResponse,
  grades_response_schema,
} from './grades.schema';

const publishedAssignmentStatuses = ['published', 'closed'] as const;

type GetGradesErrorCode =
  | 'NOT_ENROLLED'
  | 'ASSIGNMENT_FETCH_FAILED'
  | 'SUBMISSION_FETCH_FAILED'
  | 'VALIDATION_FAILED';

type GetGradesResult = HandlerResult<GradesResponse, GetGradesErrorCode>;

export const getGradesForCourse = async (
  supabase: SupabaseClient,
  courseId: string,
  learnerId: string,
): Promise<GetGradesResult> => {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', learnerId)
    .eq('status', 'active')
    .maybeSingle();

  if (enrollmentError) {
    return failure(
      500,
      'NOT_ENROLLED',
      'Failed to verify enrollment.',
    );
  }

  if (!enrollment) {
    return failure(403, 'NOT_ENROLLED', 'You are not enrolled in this course.');
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, title, status')
    .eq('course_id', courseId)
    .in('status', [...publishedAssignmentStatuses]);

  if (assignmentsError) {
    return failure(500, 'ASSIGNMENT_FETCH_FAILED', 'Unable to load assignments.');
  }

  if (!assignments || assignments.length === 0) {
    return success([]);
  }

  const assignmentIds = assignments.map((assignment) => assignment.id);

  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('assignment_id, score, feedback, status')
    .eq('learner_id', learnerId)
    .in('assignment_id', assignmentIds);

  if (submissionsError) {
    return failure(500, 'SUBMISSION_FETCH_FAILED', 'Unable to load submissions.');
  }

  const submissionRows = submissions ?? [];
  const submissionMap = new Map<string, (typeof submissionRows)[number]>();

  submissionRows.forEach((submission) => {
    submissionMap.set(submission.assignment_id, submission);
  });

  const transformed = assignments.map((assignment) => {
    const submission = submissionMap.get(assignment.id);

    return {
      id: assignment.id,
      title: assignment.title,
      submission: submission
        ? {
            score: submission.score ?? null,
            feedback: submission.feedback ?? null,
            status: submission.status,
          }
        : null,
    };
  });

  const parsed = grades_response_schema.safeParse(transformed);

  if (!parsed.success) {
    return failure(
      500,
      'VALIDATION_FAILED',
      'Grades response validation failed.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
