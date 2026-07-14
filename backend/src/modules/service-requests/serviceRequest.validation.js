import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters long'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters long'),
  category: z.enum(['Plumbing', 'Electrical', 'Cleaning', 'Water Supply'], {
    errorMap: () => ({ message: 'Category must be one of: Plumbing, Electrical, Cleaning, Water Supply' }),
  }),
});

export const reviewServiceRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Review status must be either APPROVED or REJECTED' }),
  }),
});

export const feedbackServiceRequestSchema = z.object({
  feedback: z.string().trim().min(1, 'Feedback text cannot be empty'),
});
