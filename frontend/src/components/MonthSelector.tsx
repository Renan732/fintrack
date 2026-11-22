import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePeriod } from '../contexts/PeriodContext';
import { MONTH_NAMES } from '../utils/format';

export function MonthSelector() {
  const { month, year, prevMonth, nextMonth, resetToCurrentMonth } = usePeriod();
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Mês anterior"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 px-3 min-w-[155px] justify-center text-sm font-medium text-slate-100">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span>
            {MONTH_NAMES[month - 1]} {year}
          </span>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          aria-label="Próximo mês"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={resetToCurrentMonth}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
