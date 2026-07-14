import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Content is required'),
  scheduledFor: z.string().trim().datetime('Scheduled date must be a valid ISO datetime string').optional(),
  targetRole: z.enum(['ADMIN', 'COMMITTEE', 'RESIDENT']).optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional(),
  content: z.string().trim().min(1, 'Content cannot be empty').optional(),
  scheduledFor: z.string().trim().datetime('Scheduled date must be a valid ISO datetime string').optional(),
  targetRole: z.enum(['ADMIN', 'COMMITTEE', 'RESIDENT']).nullable().optional(),
});
