import { z } from 'zod';

export const assignmentStatusValues = ['draft', 'published', 'closed'] as const;

export const ASSIGNMENT_STATUS = {
  DRAFT: assignmentStatusValues[0],
  PUBLISHED: assignmentStatusValues[1],
  CLOSED: assignmentStatusValues[2],
} as const satisfies Record<string, (typeof assignmentStatusValues)[number]>;

export const assignmentStatusSchema = z.enum(assignmentStatusValues);

export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

export const assignmentRowSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.string().nullable(),
  weight: z.number().min(0).max(100),
  late_submission_allowed: z.boolean(),
  resubmission_allowed: z.boolean(),
  status: assignmentStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const publishAssignmentResponseSchema = assignmentRowSchema.pick({
  id: true,
  course_id: true,
  status: true,
  updated_at: true,
});

export type PublishAssignmentResponse = z.infer<
  typeof publishAssignmentResponseSchema
>;
