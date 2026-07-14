import { z } from 'zod';

export const createComplaintSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters long'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters long'),
  category: z.string().trim().min(1, 'Category is required'),
});

export const addCommentSchema = z.object({
  comment: z.string().trim().min(1, 'Comment text cannot be empty'),
});
