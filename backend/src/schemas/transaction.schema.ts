import { z } from 'zod';

export const createTransactionSchema = z.object({
  title: z.string().trim().min(2, 'Informe uma descrição de pelo menos 2 caracteres.').max(120),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'O tipo deve ser INCOME ou EXPENSE.' }),
  }),
  date: z.coerce.date({
    errorMap: () => ({ message: 'Informe uma data válida.' }),
  }),
  categoryId: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().max(300).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().trim().min(1).optional(),
  search: z.string().trim().optional(),
});
