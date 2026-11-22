import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(80),
  email: z.string().trim().email('Informe um e-mail válido.').toLowerCase(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').toLowerCase(),
  password: z.string().min(1, 'Informe sua senha.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(80),
  email: z.string().trim().email('Informe um e-mail válido.').toLowerCase(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual.'),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.').max(100),
});
