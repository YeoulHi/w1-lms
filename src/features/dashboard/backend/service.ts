import { SupabaseClient } from '@supabase/supabase-js';
import { HandlerResult, success, failure } from '@/backend/http/response';
import type { InstructorDashboardResponse } from './schema';

export const getInstructorDashboard = async (
  supabase: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<InstructorDashboardResponse, string, unknown>> => {
  try {
    // 1. Fetch instructor's courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, status, created_at')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (coursesError) {
      return failure(500, 'FETCH_COURSES_FAILED', coursesError.message);
    }

    // 2. Get pending grading count
    // First, get all assignment IDs for this instructor's courses
    const { data: assignmentIds, error: assignmentIdsError } = await supabase
      .from('assignments')
      .select('id')
      .in(
        'course_id',
        courses?.map((c) => c.id) ?? []
      );

    if (assignmentIdsError) {
      return failure(
        500,
        'FETCH_ASSIGNMENT_IDS_FAILED',
        assignmentIdsError.message
      );
    }

    const { count: pendingCount, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .in(
        'assignment_id',
        assignmentIds?.map((a) => a.id) ?? []
      );

    if (countError) {
      return failure(500, 'FETCH_PENDING_COUNT_FAILED', countError.message);
    }

    // 3. Fetch recent submissions (last 5)
    const { data: recentSubmissionsData, error: submissionsError } =
      await supabase
        .from('submissions')
        .select(
          `
          id,
          assignment_id,
          submitted_at,
          status,
          is_late,
          assignments!inner(
            title,
            course_id,
            courses!inner(
              title,
              instructor_id
            )
          ),
          profiles!inner(
            name
          )
        `
        )
        .eq('assignments.courses.instructor_id', instructorId)
        .order('submitted_at', { ascending: false })
        .limit(5);

    if (submissionsError) {
      return failure(
        500,
        'FETCH_RECENT_SUBMISSIONS_FAILED',
        submissionsError.message
      );
    }

    // Transform recent submissions
    const recentSubmissions = (recentSubmissionsData ?? []).map((sub: any) => ({
      id: sub.id,
      assignment_id: sub.assignment_id,
      assignment_title: sub.assignments.title,
      course_title: sub.assignments.courses.title,
      learner_name: sub.profiles.name,
      submitted_at: sub.submitted_at,
      status: sub.status,
      is_late: sub.is_late,
    }));

    return success({
      courses: courses ?? [],
      pending_grading_count: pendingCount ?? 0,
      recent_submissions: recentSubmissions,
    });
  } catch (error) {
    return failure(
      500,
      'INTERNAL_SERVER_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
