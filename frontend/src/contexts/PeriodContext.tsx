import { createContext, useContext, useState, type ReactNode } from 'react';

interface PeriodContextValue {
  month: number;
  year: number;
  prevMonth: () => void;
  nextMonth: () => void;
  resetToCurrentMonth: () => void;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const resetToCurrentMonth = () => {
    const current = new Date();
    setMonth(current.getMonth() + 1);
    setYear(current.getFullYear());
  };

  return (
    <PeriodContext.Provider
      value={{ month, year, prevMonth, nextMonth, resetToCurrentMonth }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) {
    throw new Error('usePeriod deve ser usado dentro de PeriodProvider');
  }
  return ctx;
}
