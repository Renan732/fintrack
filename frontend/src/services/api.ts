import type {
  Budget,
  Category,
  DashboardSummary,
  Goal,
  GoalsSummary,
  Transaction,
  TransactionType,
  User,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333') + '/api';
const TOKEN_STORAGE_KEY = '@fintrack:token';

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Verifique se o servidor back-end está rodando.',
      0
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const firstDetail = Array.isArray(data.details) ? data.details[0]?.message : null;
    throw new ApiError(firstDetail || data.error || 'Erro ao processar requisição.', response.status);
  }

  return data as T;
}

export const authApi = {
  login(email: string, password: string) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(name: string, email: string, password: string) {
    return request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
  me() {
    return request<{ user: User }>('/auth/me');
  },
  updateProfile(payload: { name: string; email: string }) {
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export const categoriesApi = {
  list(type?: TransactionType) {
    const query = type ? `?type=${type}` : '';
    return request<{ categories: Category[] }>(`/categories${query}`);
  },
  create(payload: { name: string; type: TransactionType; color: string; icon?: string }) {
    return request<{ category: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: { name?: string; color?: string; icon?: string }) {
    return request<{ category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return request<void>(`/categories/${id}`, { method: 'DELETE' });
  },
};

export interface TransactionFilters {
  month?: number;
  year?: number;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
}

export interface TransactionPayload {
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId?: string | null;
  notes?: string | null;
}

export const transactionsApi = {
  list(filters: TransactionFilters = {}) {
    const params = new URLSearchParams();
    if (filters.month) params.set('month', String(filters.month));
    if (filters.year) params.set('year', String(filters.year));
    if (filters.type) params.set('type', filters.type);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return request<{ transactions: Transaction[] }>(`/transactions${qs ? `?${qs}` : ''}`);
  },
  create(payload: TransactionPayload) {
    return request<{ transaction: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: Partial<TransactionPayload>) {
    return request<{ transaction: Transaction }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return request<void>(`/transactions/${id}`, { method: 'DELETE' });
  },
};

export const budgetsApi = {
  list(month: number, year: number) {
    return request<{ period: { month: number; year: number }; budgets: Budget[] }>(
      `/budgets?month=${month}&year=${year}`
    );
  },
  upsert(payload: { categoryId: string; limitAmount: number; month: number; year: number }) {
    return request<{ budget: Budget }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  copyPrevious(month: number, year: number) {
    return request<{ copiedCount: number; period: { month: number; year: number }; budgets: Budget[] }>(
      '/budgets/copy-previous',
      {
        method: 'POST',
        body: JSON.stringify({ month, year }),
      }
    );
  },
  remove(id: string) {
    return request<void>(`/budgets/${id}`, { method: 'DELETE' });
  },
};

export interface GoalPayload {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string | null;
  color?: string;
  icon?: string;
}

export const goalsApi = {
  list() {
    return request<{ goals: Goal[]; summary: GoalsSummary }>('/goals');
  },
  create(payload: GoalPayload) {
    return request<{ goal: Goal }>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: Partial<GoalPayload>) {
    return request<{ goal: Goal }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  contribute(id: string, payload: { amount: number; operation: 'DEPOSIT' | 'WITHDRAW' }) {
    return request<{ goal: Goal }>(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return request<void>(`/goals/${id}`, { method: 'DELETE' });
  },
};

export const dashboardApi = {
  summary(month: number, year: number) {
    return request<DashboardSummary>(`/dashboard/summary?month=${month}&year=${year}`);
  },
};
