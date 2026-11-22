const MONTH_SHORT_NAMES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function getMonthDateRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function formatMonthLabel(month: number, year: number): string {
  const shortYear = String(year).slice(-2);
  return `${MONTH_SHORT_NAMES[month - 1]}/${shortYear}`;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
