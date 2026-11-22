export type TransactionType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes: string | null;
  categoryId: string | null;
  category: Category | null;
}

export interface Budget {
  id: string;
  month: number;
  year: number;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  completed: boolean;
  deadline: string | null;
  color: string;
  icon: string;
  createdAt: string;
}

export interface GoalsSummary {
  totalTarget: number;
  totalSaved: number;
  overallPercentage: number;
  completedCount?: number;
}

export interface ExpenseByCategory {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

export interface MonthlyHistoryItem {
  label: string;
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardSummary {
  period: {
    month: number;
    year: number;
  };
  totals: {
    income: number;
    expense: number;
    balance: number;
    overallBalance: number;
    savingsRate: number | null;
  };
  comparison: {
    previousIncome: number;
    previousExpense: number;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
  };
  expensesByCategory: ExpenseByCategory[];
  monthlyHistory: MonthlyHistoryItem[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  goalsSummary: GoalsSummary;
}
