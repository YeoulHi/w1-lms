import { z } from 'zod';

export const EnrollmentRequestSchema = z.object({
  courseId: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
});

export type EnrollmentRequest = z.infer<typeof EnrollmentRequestSchema>;

export const EnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  learnerId: z.string().uuid(),
  enrolledAt: z.string(),
});

export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;

export const EnrollmentTableRowSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  enrolled_at: z.string(),
});

export type EnrollmentRow = z.infer<typeof EnrollmentTableRowSchema>;

export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
});

export type CourseRow = z.infer<typeof CourseTableRowSchema>;
