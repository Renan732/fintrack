import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';
import { signToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Já existe uma conta cadastrada com este e-mail.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Cria o usuário e suas categorias iniciais na mesma transação do banco
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        categories: {
          create: DEFAULT_CATEGORIES.map((cat) => ({
            name: cat.name,
            type: cat.type,
            color: cat.color,
            icon: cat.icon,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const token = signToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const token = signToken(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email } = updateProfileSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: req.userId! },
      },
    });

    if (existing) {
      throw new AppError('Este e-mail já está em uso por outra conta.', 409);
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new AppError('A senha atual está incorreta.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash },
    });

    res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    next(err);
  }
}
