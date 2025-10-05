import { z } from 'zod';

export const submissionStatusSchema = z.enum([
  'submitted',
  'resubmission_required',
  'graded',
]);

export const gradeSubmissionRequestSchema = z.object({
  score: z.number().min(0, '점수는 0점 이상이어야 합니다.').max(100, '점수는 100점 이하여야 합니다.'),
  feedback: z.string().min(1, '피드백은 필수입니다.'),
});

export const gradeSubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  submitted_at: z.string(),
  content_text: z.string(),
  content_link: z.string().nullable(),
  status: submissionStatusSchema,
  is_late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const assignmentSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  course_id: z.string().uuid(),
});

export const assignmentSubmissionItemSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  learner_name: z.string(),
  submitted_at: z.string(),
  status: submissionStatusSchema,
  score: z.number().nullable(),
  is_late: z.boolean(),
  feedback: z.string().nullable(),
});

export const assignmentSubmissionsResponseSchema = z.object({
  assignment: assignmentSummarySchema,
  submissions: z.array(assignmentSubmissionItemSchema),
});

export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type GradeSubmissionRequest = z.infer<typeof gradeSubmissionRequestSchema>;
export type GradeSubmissionResponse = z.infer<typeof gradeSubmissionResponseSchema>;
export type AssignmentSummary = z.infer<typeof assignmentSummarySchema>;
export type AssignmentSubmissionItem = z.infer<typeof assignmentSubmissionItemSchema>;
export type AssignmentSubmissionsResponse = z.infer<
  typeof assignmentSubmissionsResponseSchema
>;
