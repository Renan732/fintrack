import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { usePeriod } from '../contexts/PeriodContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError, categoriesApi, transactionsApi } from '../services/api';
import type { Category, Transaction, TransactionType } from '../types';
import { exportTransactionsToCsv, formatCurrency, formatDate } from '../utils/format';
import { CategoryIcon } from '../utils/categoryIcons';
import { TransactionModal } from '../components/TransactionModal';
import { ConfirmModal } from '../components/ConfirmModal';

type SortField = 'date' | 'amount' | 'title';
type SortDirection = 'asc' | 'desc';

export function TransactionsPage() {
  const { month, year } = usePeriod();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | TransactionType>('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Ordenação
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasActiveFilters = Boolean(search.trim() || typeFilter || categoryFilter);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, catRes] = await Promise.all([
        transactionsApi.list({
          month,
          year,
          type: typeFilter || undefined,
          categoryId: categoryFilter || undefined,
          search: search.trim() || undefined,
        }),
        categoriesApi.list(),
      ]);
      setTransactions(txRes.transactions);
      setCategories(catRes.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar transações.');
    } finally {
      setLoading(false);
    }
  }, [month, year, typeFilter, categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(loadData, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const sortedTransactions = useMemo(() => {
    const items = [...transactions];
    const dir = sortDir === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      if (sortField === 'amount') {
        return (a.amount - b.amount) * dir;
      }
      if (sortField === 'title') {
        return a.title.localeCompare(b.title, 'pt-BR') * dir;
      }
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });
    return items;
  }, [transactions, sortField, sortDir]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'INCOME') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'title' ? 'asc' : 'desc');
    }
  }

  function clearFilters() {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
  }

  async function handleConfirmDelete() {
    if (!txToDelete) return;
    setDeleting(true);
    try {
      await transactionsApi.remove(txToDelete.id);
      showToast('Transação excluída com sucesso.');
      setTxToDelete(null);
      loadData();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Não foi possível excluir a transação.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleExportCsv() {
    exportTransactionsToCsv(
      sortedTransactions,
      `fintrack-${year}-${String(month).padStart(2, '0')}.csv`
    );
    showToast('Arquivo CSV exportado com sucesso!');
  }

  function handleOpenCreate() {
    setEditingTx(null);
    setModalOpen(true);
  }

  function handleOpenEdit(tx: Transaction) {
    setEditingTx(tx);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Transações</h1>
          <p className="text-sm text-slate-400">
            Consulte, filtre, ordene, edite e exporte suas movimentações financeiras.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={transactions.length === 0}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova transação
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="md:col-span-2 relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, categoria ou observação..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as '' | TransactionType)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Resumo dos itens filtrados */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span>
            Exibindo <strong className="text-slate-200">{transactions.length}</strong> registro(s)
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span>
            Entradas:{' '}
            <strong className="text-emerald-400">{formatCurrency(filteredTotals.income)}</strong>
          </span>
          <span>
            Saídas:{' '}
            <strong className="text-rose-400">{formatCurrency(filteredTotals.expense)}</strong>
          </span>
          <span>
            Saldo:{' '}
            <strong className={filteredTotals.balance >= 0 ? 'text-white' : 'text-rose-400'}>
              {formatCurrency(filteredTotals.balance)}
            </strong>
          </span>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando transações...</div>
        ) : sortedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400">
              Nenhuma transação encontrada para os filtros selecionados.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Registrar primeira transação
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-white transition cursor-pointer"
                    >
                      Descrição
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 font-medium">Categoria</th>
                  <th className="px-5 py-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-white transition cursor-pointer"
                    >
                      Data
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center gap-1 hover:text-white transition cursor-pointer ml-auto"
                    >
                      Valor
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {sortedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-100">{tx.title}</p>
                      {tx.notes && <p className="text-xs text-slate-500 mt-0.5">{tx.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.category ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-0.5 text-xs text-slate-200">
                          <CategoryIcon
                            icon={tx.category.icon}
                            color={tx.category.color}
                            className="h-3 w-3"
                          />
                          {tx.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Sem categoria</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap ${
                        tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          title="Editar"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxToDelete(tx)}
                          title="Excluir"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        categories={categories}
        editingTransaction={editingTx}
        defaultMonth={month}
        defaultYear={year}
      />

      <ConfirmModal
        open={Boolean(txToDelete)}
        title="Excluir transação"
        description={`Deseja realmente excluir "${txToDelete?.title ?? ''}"? Esta ação não pode ser desfeita.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
}
