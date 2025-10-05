import { z } from 'zod';

export const CreateCourseRequestSchema = z.object({
  title: z.string().min(1, { message: '제목은 필수입니다.' }),
});

export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;

export const CreateCourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  instructorId: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
});

export type CreateCourseResponse = z.infer<typeof CreateCourseResponseSchema>;

export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  instructor_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.string(),
});

export type CourseRow = z.infer<typeof CourseTableRowSchema>;
