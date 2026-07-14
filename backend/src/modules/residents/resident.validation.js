import { z } from 'zod';

export const onboardResidentSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(5, 'Phone number is required and must be valid'),
  flatId: z.string().uuid('Invalid flat ID (must be UUID)'),
  status: z.enum(['OWNER', 'TENANT', 'LEFT']).optional().default('OWNER'),
});

export const updateResidentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().trim().min(5, 'Phone number must be valid').optional(),
  flatId: z.string().uuid('Invalid flat ID (must be UUID)').optional(),
  status: z.enum(['OWNER', 'TENANT', 'LEFT']).optional(),
});
