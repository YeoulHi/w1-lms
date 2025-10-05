import { z } from 'zod';

export const submitAssignmentRequestSchema = z.object({
  content: z.string().min(1, '내용은 필수입니다.'),
  link: z.string().url('유효한 URL을 입력해주세요.').optional().or(z.literal('')),
});

export const submitAssignmentResponseSchema = z.object({
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

export type SubmitAssignmentRequest = z.infer<typeof submitAssignmentRequestSchema>;
export type SubmitAssignmentResponse = z.infer<typeof submitAssignmentResponseSchema>;
