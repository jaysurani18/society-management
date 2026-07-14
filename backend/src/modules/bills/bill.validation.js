import { z } from 'zod';

export const batchGenerateSchema = z.object({
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  }).positive('Amount must be positive'),
  billingMonth: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Billing month must be in YYYY-MM format'),
  dueDate: z.string().trim().datetime('Due date must be a valid ISO date string'),
});

export const assignPenaltySchema = z.object({
  penaltyAmount: z.number({
    required_error: 'Penalty amount is required',
    invalid_type_error: 'Penalty amount must be a number',
  }).positive('Penalty amount must be positive'),
});
