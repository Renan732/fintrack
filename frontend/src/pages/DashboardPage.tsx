import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { ApiError, categoriesApi, dashboardApi } from '../services/api';
import type { Category, DashboardSummary } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { CategoryIcon } from '../utils/categoryIcons';
import { TransactionModal } from '../components/TransactionModal';

function DeltaBadge({
  pct,
  invertColors = false,
}: {
  pct: number | null;
  invertColors?: boolean;
}) {
  if (pct === null) {
    return <span className="text-xs text-slate-500">Sem base no mês anterior</span>;
  }

  const isPositive = pct >= 0;
  const isGood = invertColors ? !isPositive : isPositive;
  const colorClass = isGood
    ? 'bg-emerald-500/15 text-emerald-300'
    : 'bg-rose-500/15 text-rose-300';

  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${colorClass}`}>
      {isPositive ? '+' : ''}
      {pct}% vs mês anterior
    </span>
  );
}

export function DashboardPage() {
  const { month, year } = usePeriod();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, catRes] = await Promise.all([
        dashboardApi.summary(month, year),
        categoriesApi.list(),
      ]);
      setSummary(summaryRes);
      setCategories(catRes.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-32 rounded-2xl border border-slate-800 bg-slate-900/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
        <p className="font-medium">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-3 rounded-xl bg-rose-500/20 px-4 py-1.5 text-xs font-medium hover:bg-rose-500/30 transition cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Título + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Visão Geral</h1>
          <p className="text-sm text-slate-400">
            Acompanhe receitas, despesas, metas e objetivos do período selecionado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nova transação
        </button>
      </div>

      {/* Cards de KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo do mês</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <p
            className={`text-2xl font-bold ${
              summary.totals.balance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatCurrency(summary.totals.balance)}
          </p>
          <div className="mt-2">
            {summary.totals.savingsRate !== null ? (
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                  summary.totals.savingsRate >= 0
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                Taxa de poupança: {summary.totals.savingsRate}%
              </span>
            ) : (
              <span className="text-xs text-slate-500">Receitas menos despesas</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Receitas</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.totals.income)}
          </p>
          <div className="mt-2">
            <DeltaBadge pct={summary.comparison.incomeChangePct} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Despesas</span>
            <ArrowDownRight className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">
            {formatCurrency(summary.totals.expense)}
          </p>
          <div className="mt-2">
            <DeltaBadge pct={summary.comparison.expenseChangePct} invertColors />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo acumulado</span>
            <Landmark className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-300">
            {formatCurrency(summary.totals.overallBalance)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Total histórico de todas as contas</p>
        </div>
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras — Últimos 6 meses */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Evolução dos últimos 6 meses</h2>
              <p className="text-xs text-slate-400">Comparativo mensal entre receitas e despesas</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Receitas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                Despesas
              </span>
              <TrendingUp className="h-4 w-4 text-slate-500 hidden sm:block" />
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyHistory} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'income' ? 'Receitas' : 'Despesas',
                  ]}
                />
                <Bar dataKey="income" name="income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Donut — Despesas por Categoria */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col">
          <h2 className="text-base font-semibold text-white">Despesas por categoria</h2>
          <p className="text-xs text-slate-400 mb-4">Distribuição dos gastos do mês</p>

          {summary.expensesByCategory.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-slate-500 py-10">
              Nenhuma despesa registrada neste mês.
            </div>
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.expensesByCategory}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {summary.expensesByCategory.map((item, idx) => (
                        <Cell key={item.categoryId ?? idx} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                {summary.expensesByCategory.map((item) => (
                  <li
                    key={item.categoryId ?? item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${item.color}22` }}
                      >
                        <CategoryIcon icon={item.icon} color={item.color} className="h-3 w-3" />
                      </span>
                      <span className="truncate text-slate-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium text-white">{formatCurrency(item.total)}</span>
                      <span className="text-slate-500 w-9 text-right">{item.percentage}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* Metas + Últimas Transações */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metas do Mês */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Metas do mês</h2>
            <Link
              to="/budgets"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Gerenciar metas →
            </Link>
          </div>

          {summary.budgets.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Você ainda não definiu metas de gastos para este mês.
            </p>
          ) : (
            <div className="space-y-4">
              {summary.budgets.map((budget) => {
                const barColor =
                  budget.status === 'exceeded'
                    ? 'bg-rose-500'
                    : budget.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500';

                return (
                  <div key={budget.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-slate-200">
                        <CategoryIcon
                          icon={budget.category.icon}
                          color={budget.category.color}
                          className="h-3.5 w-3.5"
                        />
                        {budget.category.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        <strong className="text-slate-100">
                          {formatCurrency(budget.spentAmount)}
                        </strong>{' '}
                        / {formatCurrency(budget.limitAmount)} ({budget.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimas Transações */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Últimas transações</h2>
            <Link
              to="/transactions"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Ver todas →
            </Link>
          </div>

          {summary.recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma movimentação registrada neste mês.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/80">
              {summary.recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${tx.category?.color ?? '#64748b'}22`,
                      }}
                    >
                      <CategoryIcon
                        icon={tx.category?.icon}
                        color={tx.category?.color ?? '#94a3b8'}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{tx.title}</p>
                      <p className="text-xs text-slate-400">
                        {tx.category?.name ?? 'Sem categoria'} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Objetivos Financeiros em Andamento */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Objetivos financeiros</h2>
              <p className="text-xs text-slate-400">
                Total acumulado:{' '}
                <strong className="text-emerald-400">
                  {formatCurrency(summary.goalsSummary.totalSaved)}
                </strong>{' '}
                de {formatCurrency(summary.goalsSummary.totalTarget)} (
                {summary.goalsSummary.overallPercentage}%)
              </p>
            </div>
          </div>
          <Link
            to="/goals"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Gerenciar objetivos →
          </Link>
        </div>

        {summary.goals.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            Nenhum objetivo cadastrado ainda. Crie metas de reserva, viagem ou compras!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${goal.color}22` }}
                  >
                    <CategoryIcon icon={goal.icon} color={goal.color} className="h-4 w-4" />
                  </div>
                  <p className="truncate text-sm font-medium text-slate-100">{goal.title}</p>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-white">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-slate-400">{goal.percentage}%</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${goal.percentage}%`, backgroundColor: goal.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        categories={categories}
        defaultMonth={month}
        defaultYear={year}
      />
    </div>
  );
}
