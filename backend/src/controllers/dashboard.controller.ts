import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { listBudgetsQuerySchema } from '../schemas/budget.schema';
import { formatMonthLabel, getMonthDateRange, roundMoney } from '../utils/dateRange';
import { getEnrichedBudgets } from './budget.controller';
import { getEnrichedGoals } from './goal.controller';

function computeChangePct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listBudgetsQuerySchema.parse(req.query);
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    const userId = req.userId!;

    const { start: monthStart, end: monthEnd } = getMonthDateRange(month, year);

    // Janela de 6 meses (5 meses anteriores + mês selecionado)
    const historyStart = new Date(year, month - 6, 1, 0, 0, 0, 0);

    const [monthTransactions, allGroupedByType, historyTransactions, budgets, goals] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: monthStart, lte: monthEnd },
          },
          include: {
            category: {
              select: { id: true, name: true, color: true, icon: true },
            },
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId },
          _sum: { amount: true },
        }),
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: historyStart, lte: monthEnd },
          },
          select: { amount: true, type: true, date: true },
        }),
        getEnrichedBudgets(userId, month, year),
        getEnrichedGoals(userId),
      ]);

    // Totais do mês selecionado
    let income = 0;
    let expense = 0;
    const categoryMap = new Map<
      string,
      { categoryId: string | null; name: string; color: string; icon: string; total: number }
    >();

    for (const tx of monthTransactions) {
      if (tx.type === 'INCOME') {
        income += tx.amount;
      } else {
        expense += tx.amount;
        const key = tx.category?.id ?? 'uncategorized';
        const current = categoryMap.get(key) ?? {
          categoryId: tx.category?.id ?? null,
          name: tx.category?.name ?? 'Sem categoria',
          color: tx.category?.color ?? '#64748b',
          icon: tx.category?.icon ?? 'tag',
          total: 0,
        };
        current.total += tx.amount;
        categoryMap.set(key, current);
      }
    }

    income = roundMoney(income);
    expense = roundMoney(expense);
    const balance = roundMoney(income - expense);

    // Saldo acumulado geral de todas as transações do usuário
    let totalAllIncome = 0;
    let totalAllExpense = 0;
    for (const group of allGroupedByType) {
      if (group.type === 'INCOME') totalAllIncome = group._sum.amount ?? 0;
      if (group.type === 'EXPENSE') totalAllExpense = group._sum.amount ?? 0;
    }
    const overallBalance = roundMoney(totalAllIncome - totalAllExpense);

    // Despesas agrupadas por categoria (ordenadas da maior para a menor)
    const expensesByCategory = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        total: roundMoney(item.total),
        percentage: expense > 0 ? Math.round((item.total / expense) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Histórico dos últimos 6 meses
    const historyBuckets = new Map<
      string,
      { label: string; month: number; year: number; income: number; expense: number }
    >();

    for (let offset = 5; offset >= 0; offset--) {
      const refDate = new Date(year, month - 1 - offset, 1);
      const m = refDate.getMonth() + 1;
      const y = refDate.getFullYear();
      const key = `${y}-${m}`;
      historyBuckets.set(key, {
        label: formatMonthLabel(m, y),
        month: m,
        year: y,
        income: 0,
        expense: 0,
      });
    }

    for (const tx of historyTransactions) {
      const m = tx.date.getMonth() + 1;
      const y = tx.date.getFullYear();
      const bucket = historyBuckets.get(`${y}-${m}`);
      if (!bucket) continue;
      if (tx.type === 'INCOME') bucket.income += tx.amount;
      else bucket.expense += tx.amount;
    }

    const monthlyHistory = Array.from(historyBuckets.values()).map((bucket) => ({
      ...bucket,
      income: roundMoney(bucket.income),
      expense: roundMoney(bucket.expense),
      balance: roundMoney(bucket.income - bucket.expense),
    }));

    const previousBucket = monthlyHistory[monthlyHistory.length - 2];
    const previousIncome = previousBucket?.income ?? 0;
    const previousExpense = previousBucket?.expense ?? 0;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

    const totalGoalTarget = roundMoney(goals.reduce((acc, g) => acc + g.targetAmount, 0));
    const totalGoalSaved = roundMoney(goals.reduce((acc, g) => acc + g.currentAmount, 0));

    res.json({
      period: { month, year },
      totals: {
        income,
        expense,
        balance,
        overallBalance,
        savingsRate,
      },
      comparison: {
        previousIncome,
        previousExpense,
        incomeChangePct: computeChangePct(income, previousIncome),
        expenseChangePct: computeChangePct(expense, previousExpense),
      },
      expensesByCategory,
      monthlyHistory,
      recentTransactions: monthTransactions.slice(0, 5),
      budgets,
      goals: goals.slice(0, 4),
      goalsSummary: {
        totalTarget: totalGoalTarget,
        totalSaved: totalGoalSaved,
        overallPercentage:
          totalGoalTarget > 0
            ? Math.min(Math.round((totalGoalSaved / totalGoalTarget) * 100), 100)
            : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
