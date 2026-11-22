import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';
import type { Category, Transaction, TransactionType } from '../types';
import { ApiError, transactionsApi } from '../services/api';
import { toDateInputValue } from '../utils/format';
import { useToast } from '../contexts/ToastContext';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  editingTransaction?: Transaction | null;
  defaultMonth?: number;
  defaultYear?: number;
}

function getDefaultDateForPeriod(month?: number, year?: number): string {
  const now = new Date();
  if (!month || !year) return toDateInputValue();
  if (now.getMonth() + 1 === month && now.getFullYear() === year) {
    return toDateInputValue();
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(now.getDate(), daysInMonth);
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function TransactionModal({
  open,
  onClose,
  onSaved,
  categories,
  editingTransaction,
  defaultMonth,
  defaultYear,
}: TransactionModalProps) {
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setAmount(String(editingTransaction.amount));
      setDate(toDateInputValue(editingTransaction.date));
      setCategoryId(editingTransaction.categoryId ?? '');
      setNotes(editingTransaction.notes ?? '');
    } else {
      setType('EXPENSE');
      setTitle('');
      setAmount('');
      setDate(getDefaultDateForPeriod(defaultMonth, defaultYear));
      setCategoryId('');
      setNotes('');
    }
  }, [open, editingTransaction, defaultMonth, defaultYear]);

  // Limpa categoria selecionada caso mude o tipo e ela não pertença ao novo tipo
  useEffect(() => {
    if (!categoryId) return;
    const stillValid = categories.some((c) => c.id === categoryId && c.type === type);
    if (!stillValid) setCategoryId('');
  }, [type, categoryId, categories]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor numérico maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parsedAmount,
        type,
        // Meio-dia UTC evita problemas de fuso horário mudando o dia
        date: `${date}T12:00:00.000Z`,
        categoryId: categoryId || null,
        notes: notes.trim() || null,
      };

      if (editingTransaction) {
        await transactionsApi.update(editingTransaction.id, payload);
        showToast('Transação atualizada com sucesso!');
      } else {
        await transactionsApi.create(payload);
        showToast('Transação adicionada com sucesso!');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar transação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {editingTransaction ? 'Editar transação' : 'Nova transação'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor Receita / Despesa */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition cursor-pointer ${
                type === 'EXPENSE'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Despesa
            </button>

            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition cursor-pointer ${
                type === 'INCOME'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Receita
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Descrição</label>
            <input
              type="text"
              required
              minLength={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações <span className="text-slate-500">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
            >
              {saving ? 'Salvando...' : editingTransaction ? 'Salvar alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
