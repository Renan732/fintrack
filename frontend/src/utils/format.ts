import type { Transaction } from '../types';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function toDateInputValue(isoDate?: string): string {
  const date = isoDate ? new Date(isoDate) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename = 'fintrack-transacoes.csv'
): void {
  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor (R$)', 'Observações'];

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const rows = transactions.map((tx) => [
    formatDate(tx.date),
    tx.title,
    tx.type === 'INCOME' ? 'Receita' : 'Despesa',
    tx.category?.name ?? 'Sem categoria',
    tx.amount.toFixed(2).replace('.', ','),
    tx.notes ?? '',
  ]);

  // BOM (\uFEFF) garante que o Excel abra acentos em português corretamente
  const csvContent =
    '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
