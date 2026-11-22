import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  copyBudgetsSchema,
  listBudgetsQuerySchema,
  upsertBudgetSchema,
} from '../schemas/budget.schema';
import { AppError } from '../middlewares/errorHandler';
import { getMonthDateRange, roundMoney } from '../utils/dateRange';

export async function getEnrichedBudgets(userId: string, month: number, year: number) {
  const { start, end } = getMonthDateRange(month, year);

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
      orderBy: { category: { name: 'asc' } },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
        categoryId: { not: null },
      },
      select: { categoryId: true, amount: true },
    }),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const tx of expenses) {
    if (!tx.categoryId) continue;
    spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + tx.amount);
  }

  return budgets.map((budget) => {
    const spentAmount = roundMoney(spentByCategory.get(budget.categoryId) ?? 0);
    const percentage =
      budget.limitAmount > 0 ? Math.round((spentAmount / budget.limitAmount) * 100) : 0;
    const status: 'ok' | 'warning' | 'exceeded' =
      percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok';

    return {
      id: budget.id,
      month: budget.month,
      year: budget.year,
      limitAmount: budget.limitAmount,
      spentAmount,
      remainingAmount: roundMoney(budget.limitAmount - spentAmount),
      percentage,
      status,
      category: budget.category,
    };
  });
}

export async function listBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listBudgetsQuerySchema.parse(req.query);
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();

    const budgets = await getEnrichedBudgets(req.userId!, month, year);
    res.json({ period: { month, year }, budgets });
  } catch (err) {
    next(err);
  }
}

export async function upsertBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = upsertBudgetSchema.parse(req.body);

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: req.userId! },
    });

    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    if (category.type !== 'EXPENSE') {
      throw new AppError('Metas de gastos só podem ser criadas para categorias de despesa.', 400);
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: req.userId!,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        limitAmount: roundMoney(data.limitAmount),
      },
      create: {
        userId: req.userId!,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
        limitAmount: roundMoney(data.limitAmount),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    res.status(201).json({ budget });
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Meta não encontrada.', 404);
    }

    await prisma.budget.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function copyPreviousMonthBudgets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { month, year } = copyBudgetsSchema.parse(req.body);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const userId = req.userId!;

    const [previousBudgets, existingTargetBudgets] = await Promise.all([
      prisma.budget.findMany({
        where: { userId, month: prevMonth, year: prevYear },
      }),
      prisma.budget.findMany({
        where: { userId, month, year },
        select: { categoryId: true },
      }),
    ]);

    if (previousBudgets.length === 0) {
      throw new AppError('Não há metas cadastradas no mês anterior para copiar.', 404);
    }

    const existingCategoryIds = new Set(existingTargetBudgets.map((b) => b.categoryId));
    const toCreate = previousBudgets.filter((b) => !existingCategoryIds.has(b.categoryId));

    if (toCreate.length > 0) {
      await prisma.budget.createMany({
        data: toCreate.map((b) => ({
          userId,
          categoryId: b.categoryId,
          month,
          year,
          limitAmount: b.limitAmount,
        })),
      });
    }

    const budgets = await getEnrichedBudgets(userId, month, year);
    res.status(201).json({
      copiedCount: toCreate.length,
      period: { month, year },
      budgets,
    });
  } catch (err) {
    next(err);
  }
}
