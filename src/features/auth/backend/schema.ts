import { z } from 'zod';

export const SignUpBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email format.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  name: z.string().min(1, { message: 'Name is required.' }),
  phoneNumber: z.string().optional(),
  role: z.enum(['learner', 'instructor'], { message: 'Role must be either learner or instructor.' }),
  termsAgreement: z.boolean().refine((val) => val === true, { message: 'You must agree to the terms.' }),
  termsVersion: z.string().default('1.0.0'),
});

export type SignUpBody = z.infer<typeof SignUpBodySchema>;

export const SignUpResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['learner', 'instructor']),
});

export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;
