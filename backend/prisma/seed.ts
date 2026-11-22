import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../src/constants/defaultCategories';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados FinTrack...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@fintrack.dev' },
    update: {},
    create: {
      name: 'Usuário Demo',
      email: 'demo@fintrack.dev',
      passwordHash,
    },
  });

  // Garante que todas as categorias padrão existam para o usuário demo
  const categoriesByName = new Map<string, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    const saved = await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: cat.name,
          type: cat.type,
        },
      },
      update: {},
      create: {
        ...cat,
        userId: user.id,
      },
    });
    categoriesByName.set(cat.name, saved.id);
  }

  // Só insere transações de exemplo se o usuário ainda não tiver nenhuma
  const existingTransactions = await prisma.transaction.count({
    where: { userId: user.id },
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const makeDate = (monthsAgo: number, day: number) =>
    new Date(currentYear, now.getMonth() - monthsAgo, day, 12, 0, 0);

  if (existingTransactions === 0) {
    await prisma.transaction.createMany({
      data: [
        // Mês atual
        {
          title: 'Salário Mensal',
          amount: 5500,
          type: 'INCOME',
          date: makeDate(0, 5),
          notes: 'Pagamento mensal',
          userId: user.id,
          categoryId: categoriesByName.get('Salário'),
        },
        {
          title: 'Projeto Freelance Landing Page',
          amount: 1400,
          type: 'INCOME',
          date: makeDate(0, 12),
          notes: 'Entrega de site institucional',
          userId: user.id,
          categoryId: categoriesByName.get('Freelance'),
        },
        {
          title: 'Aluguel + Condomínio',
          amount: 1850,
          type: 'EXPENSE',
          date: makeDate(0, 6),
          userId: user.id,
          categoryId: categoriesByName.get('Moradia'),
        },
        {
          title: 'Supermercado do Mês',
          amount: 920.5,
          type: 'EXPENSE',
          date: makeDate(0, 8),
          userId: user.id,
          categoryId: categoriesByName.get('Alimentação'),
        },
        {
          title: 'Combustível e Transporte',
          amount: 340,
          type: 'EXPENSE',
          date: makeDate(0, 10),
          userId: user.id,
          categoryId: categoriesByName.get('Transporte'),
        },
        {
          title: 'Curso de TypeScript Avançado',
          amount: 189.9,
          type: 'EXPENSE',
          date: makeDate(0, 14),
          userId: user.id,
          categoryId: categoriesByName.get('Educação'),
        },
        {
          title: 'Cinema e Jantar',
          amount: 215,
          type: 'EXPENSE',
          date: makeDate(0, 16),
          userId: user.id,
          categoryId: categoriesByName.get('Lazer'),
        },
        // Mês anterior
        {
          title: 'Salário Mensal',
          amount: 5500,
          type: 'INCOME',
          date: makeDate(1, 5),
          userId: user.id,
          categoryId: categoriesByName.get('Salário'),
        },
        {
          title: 'Aluguel + Condomínio',
          amount: 1850,
          type: 'EXPENSE',
          date: makeDate(1, 6),
          userId: user.id,
          categoryId: categoriesByName.get('Moradia'),
        },
        {
          title: 'Supermercado',
          amount: 880,
          type: 'EXPENSE',
          date: makeDate(1, 9),
          userId: user.id,
          categoryId: categoriesByName.get('Alimentação'),
        },
        {
          title: 'Academia e Farmácia',
          amount: 260,
          type: 'EXPENSE',
          date: makeDate(1, 15),
          userId: user.id,
          categoryId: categoriesByName.get('Saúde'),
        },
        // 2 meses atrás
        {
          title: 'Salário Mensal',
          amount: 5200,
          type: 'INCOME',
          date: makeDate(2, 5),
          userId: user.id,
          categoryId: categoriesByName.get('Salário'),
        },
        {
          title: 'Aluguel + Condomínio',
          amount: 1850,
          type: 'EXPENSE',
          date: makeDate(2, 6),
          userId: user.id,
          categoryId: categoriesByName.get('Moradia'),
        },
        {
          title: 'Alimentação Geral',
          amount: 1050,
          type: 'EXPENSE',
          date: makeDate(2, 11),
          userId: user.id,
          categoryId: categoriesByName.get('Alimentação'),
        },
      ],
    });
  }

  // Cria metas de gastos de exemplo para o mês atual
  const sampleBudgets = [
    { category: 'Alimentação', limitAmount: 1100 },
    { category: 'Lazer', limitAmount: 300 },
    { category: 'Transporte', limitAmount: 400 },
  ];

  for (const item of sampleBudgets) {
    const categoryId = categoriesByName.get(item.category);
    if (!categoryId) continue;

    await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {},
      create: {
        userId: user.id,
        categoryId,
        month: currentMonth,
        year: currentYear,
        limitAmount: item.limitAmount,
      },
    });
  }

  // Cria objetivos financeiros de exemplo se ainda não existirem
  const existingGoals = await prisma.goal.count({
    where: { userId: user.id },
  });

  if (existingGoals === 0) {
    await prisma.goal.createMany({
      data: [
        {
          title: 'Reserva de Emergência',
          targetAmount: 15000,
          currentAmount: 9750,
          deadline: new Date(currentYear + 1, 5, 30, 12, 0, 0),
          color: '#10b981',
          icon: 'shield',
          userId: user.id,
        },
        {
          title: 'Viagem de Férias',
          targetAmount: 6000,
          currentAmount: 3600,
          deadline: new Date(currentYear + 1, 11, 15, 12, 0, 0),
          color: '#06b6d4',
          icon: 'plane',
          userId: user.id,
        },
        {
          title: 'Upgrade de Setup / Notebook',
          targetAmount: 5500,
          currentAmount: 2200,
          deadline: new Date(currentYear + 1, 3, 20, 12, 0, 0),
          color: '#8b5cf6',
          icon: 'laptop',
          userId: user.id,
        },
      ],
    });
  }

  console.log('✅ Seed concluído com sucesso! Usuário demo: demo@fintrack.dev / 123456');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
