import { z } from 'zod';

export const promoteCommitteeSchema = z.object({
  userId: z.string().uuid('Invalid User ID (must be UUID)'),
  responsibility: z.string().trim().min(1, 'Responsibility/Designation is required'),
  termStart: z.coerce.date().optional().default(() => new Date()),
  termEnd: z.coerce.date().optional(),
});

export const updateCommitteeSchema = z.object({
  responsibility: z.string().trim().min(1, 'Responsibility/Designation cannot be empty').optional(),
  termStart: z.coerce.date().optional(),
  termEnd: z.coerce.date().optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(5).optional(),
});
