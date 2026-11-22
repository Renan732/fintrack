import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, 'O título do objetivo deve ter pelo menos 2 caracteres.').max(80),
  targetAmount: z.coerce.number().positive('O valor alvo deve ser maior que zero.'),
  currentAmount: z.coerce
    .number()
    .min(0, 'O valor atual não pode ser negativo.')
    .default(0),
  deadline: z.coerce.date().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal válida (ex: #10b981).')
    .default('#10b981'),
  icon: z.string().trim().min(1).max(40).default('piggy-bank'),
});

export const updateGoalSchema = createGoalSchema.partial();

export const contributeGoalSchema = z.object({
  amount: z.coerce.number().positive('O valor do aporte/resgate deve ser maior que zero.'),
  operation: z.enum(['DEPOSIT', 'WITHDRAW']).default('DEPOSIT'),
});
