import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { categoryRoutes } from './category.routes';
import { transactionRoutes } from './transaction.routes';
import { budgetRoutes } from './budget.routes';
import { dashboardRoutes } from './dashboard.routes';
import { goalRoutes } from './goal.routes';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/categories', categoryRoutes);
apiRoutes.use('/transactions', transactionRoutes);
apiRoutes.use('/budgets', budgetRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/goals', goalRoutes);
