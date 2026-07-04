import { z } from 'zod';

export const createQueueSchema = z.object({
  name: z.string().min(1, 'Queue name is required'),
  priority: z.number().int().default(0),
  concurrencyLimit: z.number().int().min(1).default(10),
});

export type CreateQueueInput = z.infer<typeof createQueueSchema>;
