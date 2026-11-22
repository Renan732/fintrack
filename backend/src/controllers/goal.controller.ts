import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  contributeGoalSchema,
  createGoalSchema,
  updateGoalSchema,
} from '../schemas/goal.schema';
import { AppError } from '../middlewares/errorHandler';
import { roundMoney } from '../utils/dateRange';

export interface EnrichedGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  completed: boolean;
  deadline: Date | null;
  color: string;
  icon: string;
  createdAt: Date;
}

function enrichGoal(goal: {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  color: string;
  icon: string;
  createdAt: Date;
}): EnrichedGoal {
  const currentAmount = roundMoney(goal.currentAmount);
  const targetAmount = roundMoney(goal.targetAmount);
  const remainingAmount = roundMoney(Math.max(targetAmount - currentAmount, 0));
  const percentage =
    targetAmount > 0 ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100) : 0;

  return {
    id: goal.id,
    title: goal.title,
    targetAmount,
    currentAmount,
    remainingAmount,
    percentage,
    completed: currentAmount >= targetAmount,
    deadline: goal.deadline,
    color: goal.color,
    icon: goal.icon,
    createdAt: goal.createdAt,
  };
}

export async function getEnrichedGoals(userId: string): Promise<EnrichedGoal[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }],
  });

  return goals.map(enrichGoal);
}

export async function listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const goals = await getEnrichedGoals(req.userId!);
    const totalTarget = roundMoney(goals.reduce((acc, g) => acc + g.targetAmount, 0));
    const totalSaved = roundMoney(goals.reduce((acc, g) => acc + g.currentAmount, 0));
    const overallPercentage =
      totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

    res.json({
      goals,
      summary: {
        totalTarget,
        totalSaved,
        overallPercentage,
        completedCount: goals.filter((g) => g.completed).length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createGoalSchema.parse(req.body);

    const goal = await prisma.goal.create({
      data: {
        title: data.title,
        targetAmount: roundMoney(data.targetAmount),
        currentAmount: roundMoney(data.currentAmount),
        deadline: data.deadline ?? null,
        color: data.color,
        icon: data.icon,
        userId: req.userId!,
      },
    });

    res.status(201).json({ goal: enrichGoal(goal) });
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const data = updateGoalSchema.parse(req.body);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Objetivo não encontrado.', 404);
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.targetAmount !== undefined ? { targetAmount: roundMoney(data.targetAmount) } : {}),
        ...(data.currentAmount !== undefined
          ? { currentAmount: roundMoney(data.currentAmount) }
          : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
      },
    });

    res.json({ goal: enrichGoal(goal) });
  } catch (err) {
    next(err);
  }
}

export async function contributeGoal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const { amount, operation } = contributeGoalSchema.parse(req.body);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Objetivo não encontrado.', 404);
    }

    const nextAmount =
      operation === 'DEPOSIT'
        ? roundMoney(existing.currentAmount + amount)
        : roundMoney(existing.currentAmount - amount);

    if (nextAmount < 0) {
      throw new AppError('O valor de resgate não pode exceder o saldo guardado no objetivo.', 400);
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: { currentAmount: nextAmount },
    });

    res.json({ goal: enrichGoal(goal) });
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      throw new AppError('Objetivo não encontrado.', 404);
    }

    await prisma.goal.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
