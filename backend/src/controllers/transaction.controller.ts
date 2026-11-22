import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '../schemas/transaction.schema';
import { AppError } from '../middlewares/errorHandler';
import { getMonthDateRange, roundMoney } from '../utils/dateRange';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export async function listTransactions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listTransactionsQuerySchema.parse(req.query);
    const where: Prisma.TransactionWhereInput = {
      userId: req.userId!,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.month && query.year) {
      const { start, end } = getMonthDateRange(query.month, query.year);
      where.date = { gte: start, lte: end };
    } else if (query.year) {
      where.date = {
        gte: new Date(query.year, 0, 1, 0, 0, 0, 0),
        lte: new Date(query.year, 11, 31, 23, 59, 59, 999),
      };
    }

    let transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    if (query.search) {
      const term = normalizeText(query.search);
      transactions = transactions.filter((item) => {
        const inTitle = normalizeText(item.title).includes(term);
        const inNotes = item.notes ? normalizeText(item.notes).includes(term) : false;
        const inCategory = item.category ? normalizeText(item.category.name).includes(term) : false;
        return inTitle || inNotes || inCategory;
      });
    }

    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createTransactionSchema.parse(req.body);

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: req.userId! },
      });
      if (!category) {
        throw new AppError('Categoria informada não encontrada.', 404);
      }
      if (category.type !== data.type) {
        throw new AppError('A categoria selecionada não corresponde ao tipo da transação.', 400);
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        title: data.title,
        amount: roundMoney(data.amount),
        type: data.type,
        date: data.date,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        userId: req.userId!,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });

    res.status(201).json({ transaction });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const data = updateTransactionSchema.parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Transação não encontrada.', 404);
    }

    const nextType = data.type ?? existing.type;
    const nextCategoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;

    if (nextCategoryId) {
      const category = await prisma.category.findFirst({
        where: { id: nextCategoryId, userId: req.userId! },
      });
      if (!category) {
        throw new AppError('Categoria informada não encontrada.', 404);
      }
      if (category.type !== nextType) {
        throw new AppError('A categoria selecionada não corresponde ao tipo da transação.', 400);
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.amount !== undefined ? { amount: roundMoney(data.amount) } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Transação não encontrada.', 404);
    }

    await prisma.transaction.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
