import { z } from 'zod';

export const createFlatSchema = z.object({
  buildingName: z.string().trim().min(1, 'Building name is required'),
  flatNumber: z.string().trim().min(1, 'Flat number is required'),
  floor: z.number({
    required_error: 'Floor is required',
    invalid_type_error: 'Floor must be a number',
  }).int('Floor must be an integer'),
});
