import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';
import { AppError } from '../middlewares/errorHandler';

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const type = req.query.type === 'INCOME' || req.query.type === 'EXPENSE'
      ? req.query.type
      : undefined;

    const categories = await prisma.category.findMany({
      where: {
        userId: req.userId!,
        ...(type ? { type } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const data = updateCategorySchema.parse(req.body);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
      },
    });

    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    await prisma.category.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
