import { z } from 'zod';

// Instructor Dashboard Response Schema
export const InstructorDashboardResponseSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().nullable(),
      status: z.enum(['draft', 'published', 'archived']),
      created_at: z.string(),
    })
  ),
  pending_grading_count: z.number(),
  recent_submissions: z.array(
    z.object({
      id: z.string().uuid(),
      assignment_id: z.string().uuid(),
      assignment_title: z.string(),
      course_title: z.string(),
      learner_name: z.string(),
      submitted_at: z.string(),
      status: z.enum(['submitted', 'resubmission_required', 'graded']),
      is_late: z.boolean(),
    })
  ),
});

export type InstructorDashboardResponse = z.infer<
  typeof InstructorDashboardResponseSchema
>;
