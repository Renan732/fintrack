import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

let authToken: string;
let expenseCategoryId: string;
let incomeCategoryId: string;
let customCategoryId: string;
let transactionId: string;
let budgetId: string;
let goalId: string;

async function api<T = Record<string, unknown>>(
  path: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {},
  token?: string
): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.url = path;
    req.method = options.method ?? 'GET';

    const bodyBuffer = options.body ? Buffer.from(options.body, 'utf8') : null;
    const headers: Record<string, string> = {
      host: 'localhost',
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    };
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    if (bodyBuffer) {
      headers['content-length'] = String(bodyBuffer.length);
    }
    req.headers = headers;

    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];

    const originalWrite = res.write.bind(res);
    res.write = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      return (originalWrite as (...a: unknown[]) => boolean)(chunk, ...args);
    }) as typeof res.write;

    const originalEnd = res.end.bind(res);
    res.end = ((chunk?: unknown, ...args: unknown[]) => {
      if (chunk && typeof chunk !== 'function') {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      const result = (originalEnd as (...a: unknown[]) => ServerResponse)(chunk, ...args);
      const raw = Buffer.concat(chunks).toString('utf8');
      const status = res.statusCode;
      if (status === 204 || !raw) {
        resolve({ status, data: {} as T });
      } else {
        try {
          resolve({ status, data: JSON.parse(raw) as T });
        } catch {
          resolve({ status, data: raw as unknown as T });
        }
      }
      return result;
    }) as typeof res.end;

    res.on('error', reject);

    app(req, res);

    if (bodyBuffer) {
      req.push(bodyBuffer);
    }
    req.push(null);
  });
}

after(async () => {
  await prisma.$disconnect();
});

describe('FinTrack API Integration Suite', () => {
  it('GET /health retorna status ok e database connected', async () => {
    const { status, data } = await api<{ status: string; database: string }>('/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
    assert.equal(data.database, 'connected');
  });

  it('POST /api/auth/register cria usuário com categorias padrão e retorna JWT', async () => {
    const { status, data } = await api<{
      user: { id: string; name: string; email: string };
      token: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Maria Silva',
        email: 'maria@fintrack.dev',
        password: 'password123',
      }),
    });

    assert.equal(status, 201);
    assert.equal(data.user.email, 'maria@fintrack.dev');
    assert.ok(data.token);
    authToken = data.token;
  });

  it('POST /api/auth/register bloqueia e-mail duplicado (409)', async () => {
    const { status } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Maria Duplicada',
        email: 'maria@fintrack.dev',
        password: 'password123',
      }),
    });
    assert.equal(status, 409);
  });

  it('PUT /api/auth/profile e PUT /api/auth/password atualizam perfil e senha', async () => {
    const profileRes = await api<{ user: { name: string; email: string } }>(
      '/api/auth/profile',
      {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Maria Oliveira',
          email: 'maria@fintrack.dev',
        }),
      },
      authToken
    );

    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.data.user.name, 'Maria Oliveira');

    const pwRes = await api(
      '/api/auth/password',
      {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        }),
      },
      authToken
    );
    assert.equal(pwRes.status, 200);

    const loginRes = await api<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'maria@fintrack.dev',
        password: 'newpassword456',
      }),
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.data.token);
    authToken = loginRes.data.token;
  });

  it('GET /api/categories lista categorias padrão e permite criar, editar e excluir', async () => {
    const listRes = await api<{ categories: Array<{ id: string; name: string; type: string }> }>(
      '/api/categories',
      {},
      authToken
    );
    assert.equal(listRes.status, 200);
    assert.ok(listRes.data.categories.length >= 9);

    expenseCategoryId = listRes.data.categories.find((c) => c.type === 'EXPENSE')!.id;
    incomeCategoryId = listRes.data.categories.find((c) => c.type === 'INCOME')!.id;

    const createRes = await api<{ category: { id: string; name: string; icon: string } }>(
      '/api/categories',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Assinaturas',
          type: 'EXPENSE',
          color: '#6366f1',
          icon: 'credit-card',
        }),
      },
      authToken
    );
    assert.equal(createRes.status, 201);
    assert.equal(createRes.data.category.icon, 'credit-card');
    customCategoryId = createRes.data.category.id;

    const updateRes = await api<{ category: { name: string; color: string } }>(
      `/api/categories/${customCategoryId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Streaming & Assinaturas',
          color: '#ec4899',
        }),
      },
      authToken
    );
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.category.name, 'Streaming & Assinaturas');
    assert.equal(updateRes.data.category.color, '#ec4899');
  });

  it('CRUD de transações com filtro de busca e validação de tipo/categoria', async () => {
    const invalidRes = await api(
      '/api/transactions',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Tipo incompatível',
          amount: 100,
          type: 'INCOME',
          date: '2026-06-10T12:00:00.000Z',
          categoryId: expenseCategoryId,
        }),
      },
      authToken
    );
    assert.equal(invalidRes.status, 400);

    const incomeRes = await api<{ transaction: { id: string } }>(
      '/api/transactions',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Salário Junho',
          amount: 5000,
          type: 'INCOME',
          date: '2026-06-05T12:00:00.000Z',
          categoryId: incomeCategoryId,
        }),
      },
      authToken
    );
    assert.equal(incomeRes.status, 201);

    const expenseRes = await api<{ transaction: { id: string } }>(
      '/api/transactions',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Supermercado Central',
          amount: 750.5,
          type: 'EXPENSE',
          date: '2026-06-12T12:00:00.000Z',
          categoryId: expenseCategoryId,
          notes: 'Compras mensais',
        }),
      },
      authToken
    );
    assert.equal(expenseRes.status, 201);
    transactionId = expenseRes.data.transaction.id;

    const searchRes = await api<{ transactions: Array<{ id: string; title: string }> }>(
      '/api/transactions?month=6&year=2026&search=supermercado',
      {},
      authToken
    );
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.data.transactions.length, 1);
    assert.equal(searchRes.data.transactions[0].id, transactionId);

    const updateRes = await api<{ transaction: { amount: number } }>(
      `/api/transactions/${transactionId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ amount: 800 }),
      },
      authToken
    );
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.transaction.amount, 800);
  });

  it('Metas de gastos (Budgets): upsert, cálculo de status e cópia do mês anterior', async () => {
    const createBudget = await api<{ budget: { id: string } }>(
      '/api/budgets',
      {
        method: 'POST',
        body: JSON.stringify({
          categoryId: expenseCategoryId,
          limitAmount: 1000,
          month: 6,
          year: 2026,
        }),
      },
      authToken
    );
    assert.equal(createBudget.status, 201);
    budgetId = createBudget.data.budget.id;

    const listBudgets = await api<{
      budgets: Array<{ spentAmount: number; percentage: number; status: string }>;
    }>('/api/budgets?month=6&year=2026', {}, authToken);
    assert.equal(listBudgets.status, 200);
    assert.equal(listBudgets.data.budgets[0].spentAmount, 800);
    assert.equal(listBudgets.data.budgets[0].percentage, 80);
    assert.equal(listBudgets.data.budgets[0].status, 'warning');

    const copyRes = await api<{ copiedCount: number; budgets: Array<unknown> }>(
      '/api/budgets/copy-previous',
      {
        method: 'POST',
        body: JSON.stringify({ month: 7, year: 2026 }),
      },
      authToken
    );
    assert.equal(copyRes.status, 201);
    assert.equal(copyRes.data.copiedCount, 1);
    assert.equal(copyRes.data.budgets.length, 1);
  });

  it('Objetivos financeiros (Goals): criar, aportar, resgatar e validar saldo', async () => {
    const createRes = await api<{ goal: { id: string; percentage: number } }>(
      '/api/goals',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Reserva de Emergência',
          targetAmount: 10000,
          currentAmount: 2000,
          color: '#10b981',
          icon: 'shield',
        }),
      },
      authToken
    );
    assert.equal(createRes.status, 201);
    assert.equal(createRes.data.goal.percentage, 20);
    goalId = createRes.data.goal.id;

    const depositRes = await api<{ goal: { currentAmount: number; percentage: number } }>(
      `/api/goals/${goalId}/contribute`,
      {
        method: 'POST',
        body: JSON.stringify({ amount: 3000, operation: 'DEPOSIT' }),
      },
      authToken
    );
    assert.equal(depositRes.status, 200);
    assert.equal(depositRes.data.goal.currentAmount, 5000);
    assert.equal(depositRes.data.goal.percentage, 50);

    const overWithdraw = await api(
      `/api/goals/${goalId}/contribute`,
      {
        method: 'POST',
        body: JSON.stringify({ amount: 9000, operation: 'WITHDRAW' }),
      },
      authToken
    );
    assert.equal(overWithdraw.status, 400);
  });

  it('GET /api/dashboard/summary retorna totais, taxa de poupança e resumo de objetivos', async () => {
    const res = await api<{
      totals: { income: number; expense: number; balance: number; savingsRate: number };
      goalsSummary: { totalSaved: number; totalTarget: number; overallPercentage: number };
      monthlyHistory: Array<unknown>;
    }>('/api/dashboard/summary?month=6&year=2026', {}, authToken);

    assert.equal(res.status, 200);
    assert.equal(res.data.totals.income, 5000);
    assert.equal(res.data.totals.expense, 800);
    assert.equal(res.data.totals.balance, 4200);
    assert.equal(res.data.totals.savingsRate, 84);
    assert.equal(res.data.goalsSummary.totalSaved, 5000);
    assert.equal(res.data.goalsSummary.overallPercentage, 50);
    assert.equal(res.data.monthlyHistory.length, 6);
  });

  it('DELETE endpoints removem recursos com status 204', async () => {
    const delTx = await api(`/api/transactions/${transactionId}`, { method: 'DELETE' }, authToken);
    assert.equal(delTx.status, 204);

    const delBudget = await api(`/api/budgets/${budgetId}`, { method: 'DELETE' }, authToken);
    assert.equal(delBudget.status, 204);

    const delGoal = await api(`/api/goals/${goalId}`, { method: 'DELETE' }, authToken);
    assert.equal(delGoal.status, 204);

    const delCat = await api(`/api/categories/${customCategoryId}`, { method: 'DELETE' }, authToken);
    assert.equal(delCat.status, 204);
  });
});
