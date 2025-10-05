import { z } from 'zod';

const submissionStatusSchema = z.enum([
  'submitted',
  'resubmission_required',
  'graded',
]);

export const submission_schema = z.object({
  score: z.number().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  status: submissionStatusSchema,
});

export const graded_assignment_schema = z.object({
  id: z.string(),
  title: z.string(),
  submission: submission_schema.optional().nullable(),
});

export const grades_response_schema = z.array(graded_assignment_schema);

export type Submission = z.infer<typeof submission_schema>;
export type GradedAssignment = z.infer<typeof graded_assignment_schema>;
export type GradesResponse = z.infer<typeof grades_response_schema>;
