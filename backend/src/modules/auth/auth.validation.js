import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'COMMITTEE', 'RESIDENT']).optional().default('RESIDENT'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
}).refine(data => !!(data.currentPassword || data.oldPassword), {
  message: "Either currentPassword or oldPassword is required",
  path: ["currentPassword"]
});
