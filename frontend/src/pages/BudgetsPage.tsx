import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { usePeriod } from '../contexts/PeriodContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError, budgetsApi, categoriesApi } from '../services/api';
import type { Budget, Category, TransactionType } from '../types';
import { formatCurrency } from '../utils/format';
import {
  CATEGORY_ICON_OPTIONS,
  COLOR_SWATCHES,
  CategoryIcon,
} from '../utils/categoryIcons';
import { ConfirmModal } from '../components/ConfirmModal';

export function BudgetsPage() {
  const { month, year } = usePeriod();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Formulário de meta
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [copyingBudgets, setCopyingBudgets] = useState(false);

  // Formulário de nova categoria
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType>('EXPENSE');
  const [catColor, setCatColor] = useState(COLOR_SWATCHES[0]);
  const [catIcon, setCatIcon] = useState('tag');
  const [savingCategory, setSavingCategory] = useState(false);

  // Modal de edição de categoria
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState(COLOR_SWATCHES[0]);
  const [editCatIcon, setEditCatIcon] = useState('tag');
  const [updatingCategory, setUpdatingCategory] = useState(false);

  // Confirmações de exclusão
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackError(null);
    try {
      const [budgetsRes, catsRes] = await Promise.all([
        budgetsApi.list(month, year),
        categoriesApi.list(),
      ]);
      setBudgets(budgetsRes.budgets);
      setCategories(catsRes.categories);
    } catch (err) {
      setFeedbackError(err instanceof ApiError ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveBudget(e: FormEvent) {
    e.preventDefault();
    setFeedbackError(null);
    const parsed = Number(limitAmount.replace(',', '.'));
    if (!budgetCategoryId || !Number.isFinite(parsed) || parsed <= 0) {
      setFeedbackError('Selecione uma categoria de despesa e informe um limite válido.');
      return;
    }

    setSavingBudget(true);
    try {
      await budgetsApi.upsert({
        categoryId: budgetCategoryId,
        limitAmount: parsed,
        month,
        year,
      });
      setBudgetCategoryId('');
      setLimitAmount('');
      showToast('Meta mensal salva com sucesso!');
      loadData();
    } catch (err) {
      setFeedbackError(err instanceof ApiError ? err.message : 'Erro ao salvar meta.');
    } finally {
      setSavingBudget(false);
    }
  }

  function handleEditBudget(budget: Budget) {
    setBudgetCategoryId(budget.category.id);
    setLimitAmount(String(budget.limitAmount));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCopyPreviousMonth() {
    setFeedbackError(null);
    setCopyingBudgets(true);
    try {
      const res = await budgetsApi.copyPrevious(month, year);
      if (res.copiedCount === 0) {
        showToast('Todas as metas do mês anterior já existem neste mês.', 'info');
      } else {
        showToast(`${res.copiedCount} meta(s) copiada(s) do mês anterior!`);
      }
      loadData();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Não foi possível copiar metas do mês anterior.',
        'error'
      );
    } finally {
      setCopyingBudgets(false);
    }
  }

  async function handleConfirmDeleteBudget() {
    if (!budgetToDelete) return;
    setDeleting(true);
    try {
      await budgetsApi.remove(budgetToDelete.id);
      showToast('Meta removida.');
      setBudgetToDelete(null);
      loadData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao remover meta.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setFeedbackError(null);
    setSavingCategory(true);
    try {
      await categoriesApi.create({
        name: catName.trim(),
        type: catType,
        color: catColor,
        icon: catIcon,
      });
      setCatName('');
      setCatIcon('tag');
      showToast('Categoria criada com sucesso!');
      loadData();
    } catch (err) {
      setFeedbackError(err instanceof ApiError ? err.message : 'Erro ao criar categoria.');
    } finally {
      setSavingCategory(false);
    }
  }

  function openEditCategory(cat: Category) {
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
    setEditCatIcon(cat.icon);
  }

  async function handleUpdateCategory(e: FormEvent) {
    e.preventDefault();
    if (!editingCat) return;
    setUpdatingCategory(true);
    try {
      await categoriesApi.update(editingCat.id, {
        name: editCatName.trim(),
        color: editCatColor,
        icon: editCatIcon,
      });
      showToast('Categoria atualizada!');
      setEditingCat(null);
      loadData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao atualizar categoria.', 'error');
    } finally {
      setUpdatingCategory(false);
    }
  }

  async function handleConfirmDeleteCategory() {
    if (!catToDelete) return;
    setDeleting(true);
    try {
      await categoriesApi.remove(catToDelete.id);
      showToast('Categoria excluída.');
      setCatToDelete(null);
      loadData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao excluir categoria.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Metas & Categorias</h1>
        <p className="text-sm text-slate-400">
          Defina limites mensais de gastos e personalize suas categorias com ícones e cores.
        </p>
      </div>

      {feedbackError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {feedbackError}
        </div>
      )}

      {/* Seção de Metas */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Metas de gastos do mês</h2>
          </div>

          <button
            type="button"
            disabled={copyingBudgets}
            onClick={handleCopyPreviousMonth}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            {copyingBudgets ? 'Copiando...' : 'Copiar do mês anterior'}
          </button>
        </div>

        <form
          onSubmit={handleSaveBudget}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <select
            required
            value={budgetCategoryId}
            onChange={(e) => setBudgetCategoryId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Escolha a categoria de despesa...</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="1"
            required
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Limite mensal (R$)"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={savingBudget}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {savingBudget ? 'Salvando...' : 'Salvar meta'}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-slate-400">Carregando metas...</p>
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            Nenhuma meta configurada para este mês ainda. Crie uma acima ou copie do mês anterior.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => {
              const barColor =
                budget.status === 'exceeded'
                  ? 'bg-rose-500'
                  : budget.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500';

              return (
                <div
                  key={budget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${budget.category.color}22` }}
                      >
                        <CategoryIcon
                          icon={budget.category.icon}
                          color={budget.category.color}
                          className="h-4 w-4"
                        />
                      </span>
                      <h3 className="font-semibold text-white">{budget.category.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditBudget(budget)}
                        title="Editar limite"
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetToDelete(budget)}
                        title="Remover meta"
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(budget.spentAmount)}
                    </span>
                    <span className="text-xs text-slate-400">
                      de {formatCurrency(budget.limitAmount)}
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {budget.status === 'exceeded' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Ultrapassou em {formatCurrency(Math.abs(budget.remainingAmount))}
                      </span>
                    ) : budget.status === 'warning' ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Restam {formatCurrency(budget.remainingAmount)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Restam {formatCurrency(budget.remainingAmount)}
                      </span>
                    )}
                    <span className="font-semibold text-slate-300">{budget.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Seção de Categorias */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Minhas categorias</h2>
        </div>

        <form
          onSubmit={handleCreateCategory}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              minLength={2}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Nome da nova categoria (ex: Assinaturas)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value as TransactionType)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>

            <button
              type="submit"
              disabled={savingCategory}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {savingCategory ? 'Criando...' : 'Criar categoria'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">Cor:</span>
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setCatColor(swatch)}
                  aria-label={`Selecionar cor ${swatch}`}
                  className={`h-6 w-6 rounded-full transition cursor-pointer ${
                    catColor === swatch
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : ''
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">Ícone:</span>
              {CATEGORY_ICON_OPTIONS.slice(0, 10).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCatIcon(opt.key)}
                  title={opt.label}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition cursor-pointer ${
                    catIcon === opt.key
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <CategoryIcon icon={opt.key} className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${cat.color}22` }}
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{cat.name}</p>
                  <p className="text-xs text-slate-500">
                    {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditCategory(cat)}
                  title="Editar categoria"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCatToDelete(cat)}
                  title="Excluir categoria"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Editar Categoria */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Editar categoria</h2>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Cor</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setEditCatColor(swatch)}
                      className={`h-6 w-6 rounded-full transition cursor-pointer ${
                        editCatColor === swatch
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : ''
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setEditCatIcon(opt.key)}
                      title={opt.label}
                      className={`flex items-center justify-center rounded-xl border p-2 transition cursor-pointer ${
                        editCatIcon === opt.key
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CategoryIcon icon={opt.key} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingCategory}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
                >
                  {updatingCategory ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(budgetToDelete)}
        title="Remover meta"
        description={`Deseja remover a meta da categoria "${budgetToDelete?.category.name ?? ''}" para este mês?`}
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDeleteBudget}
        onCancel={() => setBudgetToDelete(null)}
      />

      <ConfirmModal
        open={Boolean(catToDelete)}
        title="Excluir categoria"
        description={`Excluir a categoria "${catToDelete?.name ?? ''}"? Transações antigas serão mantidas sem categoria.`}
        loading={deleting}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
}
