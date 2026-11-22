import { z } from 'zod';

export const upsertBudgetSchema = z.object({
  categoryId: z.string().trim().min(1, 'Selecione uma categoria.'),
  limitAmount: z.coerce.number().positive('O limite da meta deve ser maior que zero.'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const listBudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const copyBudgetsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
