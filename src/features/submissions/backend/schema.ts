import { z } from 'zod';

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
  status: z.enum(['submitted', 'resubmission_required', 'graded']),
  is_late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GradeSubmissionRequest = z.infer<typeof gradeSubmissionRequestSchema>;
export type GradeSubmissionResponse = z.infer<typeof gradeSubmissionResponseSchema>;
