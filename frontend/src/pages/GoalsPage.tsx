import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { ApiError, goalsApi } from '../services/api';
import type { Goal, GoalsSummary } from '../types';
import { formatCurrency, formatDate, toDateInputValue } from '../utils/format';
import {
  CATEGORY_ICON_OPTIONS,
  COLOR_SWATCHES,
  CategoryIcon,
} from '../utils/categoryIcons';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';

export function GoalsPage() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalsSummary>({
    totalTarget: 0,
    totalSaved: 0,
    overallPercentage: 0,
    completedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de criar/editar objetivo
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState('piggy-bank');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de aporte/resgate
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  const [contribOp, setContribOp] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [contribAmount, setContribAmount] = useState('');
  const [contribSaving, setContribSaving] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);

  // Confirmação de exclusão
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await goalsApi.list();
      setGoals(res.goals);
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar objetivos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  function openCreateModal() {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setColor(COLOR_SWATCHES[0]);
    setIcon('piggy-bank');
    setFormError(null);
    setFormOpen(true);
  }

  function openEditModal(goal: Goal) {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setDeadline(goal.deadline ? toDateInputValue(goal.deadline) : '');
    setColor(goal.color);
    setIcon(goal.icon);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSaveGoal(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsedTarget = Number(targetAmount.replace(',', '.'));
    const parsedCurrent = Number((currentAmount || '0').replace(',', '.'));

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setFormError('Informe um valor alvo maior que zero.');
      return;
    }
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      setFormError('O valor guardado inicial não pode ser negativo.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: deadline ? `${deadline}T12:00:00.000Z` : null,
        color,
        icon,
      };

      if (editingGoal) {
        await goalsApi.update(editingGoal.id, payload);
        showToast('Objetivo atualizado com sucesso!');
      } else {
        await goalsApi.create(payload);
        showToast('Novo objetivo criado com sucesso!');
      }

      setFormOpen(false);
      loadGoals();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao salvar objetivo.');
    } finally {
      setSaving(false);
    }
  }

  function openContributeModal(goal: Goal, operation: 'DEPOSIT' | 'WITHDRAW') {
    setContribGoal(goal);
    setContribOp(operation);
    setContribAmount('');
    setContribError(null);
  }

  async function handleContribute(e: FormEvent) {
    e.preventDefault();
    if (!contribGoal) return;
    setContribError(null);

    const parsed = Number(contribAmount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setContribError('Informe um valor maior que zero.');
      return;
    }

    setContribSaving(true);
    try {
      await goalsApi.contribute(contribGoal.id, {
        amount: parsed,
        operation: contribOp,
      });
      showToast(
        contribOp === 'DEPOSIT'
          ? `Aporte de ${formatCurrency(parsed)} registrado!`
          : `Resgate de ${formatCurrency(parsed)} registrado!`
      );
      setContribGoal(null);
      loadGoals();
    } catch (err) {
      setContribError(err instanceof ApiError ? err.message : 'Erro ao movimentar objetivo.');
    } finally {
      setContribSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!goalToDelete) return;
    setDeleting(true);
    try {
      await goalsApi.remove(goalToDelete.id);
      showToast('Objetivo excluído.');
      setGoalToDelete(null);
      loadGoals();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao excluir objetivo.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  function getDeadlineLabel(isoDate: string | null): string | null {
    if (!isoDate) return null;
    const diffDays = Math.ceil(
      (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return `Prazo encerrado (${formatDate(isoDate)})`;
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays <= 30) return `Faltam ${diffDays} dia(s)`;
    return `Meta para ${formatDate(isoDate)}`;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Objetivos Financeiros</h1>
          <p className="text-sm text-slate-400">
            Crie cofrinhos para suas metas de médio e longo prazo e acompanhe cada aporte.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo objetivo
        </button>
      </div>

      {/* Cards de resumo */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total guardado</span>
            <PiggyBank className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.totalSaved)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            de {formatCurrency(summary.totalTarget)} planejados
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Progresso geral</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{summary.overallPercentage}%</p>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
              style={{ width: `${summary.overallPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Concluídos</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300">
            {summary.completedCount ?? 0} / {goals.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Objetivos atingidos</p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Grid de objetivos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-52 rounded-2xl border border-slate-800 bg-slate-900/60" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <PiggyBank className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            Você ainda não criou nenhum objetivo financeiro.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro objetivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const deadlineLabel = getDeadlineLabel(goal.deadline);

            return (
              <div
                key={goal.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${goal.color}22`,
                          border: `1px solid ${goal.color}44`,
                        }}
                      >
                        <CategoryIcon icon={goal.icon} color={goal.color} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">{goal.title}</h3>
                        {deadlineLabel && (
                          <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="truncate">{deadlineLabel}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(goal)}
                        title="Editar objetivo"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        title="Excluir objetivo"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xl font-bold text-white">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        de {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${goal.percentage}%`,
                          backgroundColor: goal.completed ? '#10b981' : goal.color,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      {goal.completed ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                          <Trophy className="h-3.5 w-3.5" />
                          Objetivo concluído!
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Faltam {formatCurrency(goal.remainingAmount)}
                        </span>
                      )}
                      <span className="font-semibold text-slate-200">{goal.percentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => openContributeModal(goal, 'DEPOSIT')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    Aportar
                  </button>
                  <button
                    type="button"
                    disabled={goal.currentAmount <= 0}
                    onClick={() => openContributeModal(goal, 'WITHDRAW')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/70 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ArrowDownCircle className="h-3.5 w-3.5" />
                    Resgatar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Objetivo */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editingGoal ? 'Editar objetivo' : 'Novo objetivo'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Título</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reserva de Emergência, Viagem..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Valor alvo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="10000,00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Guardado atual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Prazo desejado <span className="text-slate-500">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_ICON_OPTIONS.slice(0, 12).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setIcon(opt.key)}
                      title={opt.label}
                      className={`flex items-center justify-center rounded-xl border p-2.5 transition cursor-pointer ${
                        icon === opt.key
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CategoryIcon icon={opt.key} className="h-4 w-4" />
                    </button>
                  ))}
                  {['piggy-bank', 'shield', 'plane', 'gift', 'laptop', 'home'].map((k) =>
                    CATEGORY_ICON_OPTIONS.slice(0, 12).some((o) => o.key === k) ? null : (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setIcon(k)}
                        className={`flex items-center justify-center rounded-xl border p-2.5 transition cursor-pointer ${
                          icon === k
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CategoryIcon icon={k} className="h-4 w-4" />
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Cor</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setColor(swatch)}
                      aria-label={`Selecionar cor ${swatch}`}
                      className={`h-6 w-6 rounded-full transition cursor-pointer ${
                        color === swatch
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : ''
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>

              {formError && (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
                >
                  {saving ? 'Salvando...' : editingGoal ? 'Salvar alterações' : 'Criar objetivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aportar / Resgatar */}
      {contribGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                {contribOp === 'DEPOSIT' ? 'Registrar aporte' : 'Registrar resgate'}
              </h2>
              <button
                type="button"
                onClick={() => setContribGoal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Objetivo: <strong className="text-slate-200">{contribGoal.title}</strong> • Saldo
              atual: <strong className="text-emerald-400">{formatCurrency(contribGoal.currentAmount)}</strong>
            </p>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {contribError && (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
                  {contribError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContribGoal(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contribSaving}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer disabled:opacity-60 ${
                    contribOp === 'DEPOSIT'
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  }`}
                >
                  {contribSaving
                    ? 'Salvando...'
                    : contribOp === 'DEPOSIT'
                      ? 'Confirmar aporte'
                      : 'Confirmar resgate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(goalToDelete)}
        title="Excluir objetivo"
        description={`Tem certeza que deseja excluir o objetivo "${goalToDelete?.title ?? ''}"? Esta ação não pode ser desfeita.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
}
