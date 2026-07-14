import { z } from 'zod';

export const recordCashPaymentSchema = z.object({
  amountPaid: z.number({
    required_error: 'Amount paid is required',
    invalid_type_error: 'Amount paid must be a number',
  }).positive('Amount paid must be positive'),
  paidByName: z.string().trim().min(1, 'Payee name (paidByName) is required'),
  discount: z.number().nonnegative('Discount must be zero or positive').optional().default(0),
});
