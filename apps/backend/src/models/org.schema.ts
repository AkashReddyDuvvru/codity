import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
