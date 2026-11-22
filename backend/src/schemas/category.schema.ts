import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.').max(40),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'O tipo deve ser INCOME ou EXPENSE.' }),
  }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal válida (ex: #10b981).')
    .default('#10b981'),
  icon: z.string().trim().min(1).max(40).default('tag'),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.').max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal válida (ex: #10b981).')
    .optional(),
  icon: z.string().trim().min(1).max(40).optional(),
});
