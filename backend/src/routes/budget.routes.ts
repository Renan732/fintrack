import { Router } from 'express';
import {
  copyPreviousMonthBudgets,
  deleteBudget,
  listBudgets,
  upsertBudget,
} from '../controllers/budget.controller';
import { authMiddleware } from '../middlewares/auth';

export const budgetRoutes = Router();

budgetRoutes.use(authMiddleware);

budgetRoutes.get('/', listBudgets);
budgetRoutes.post('/', upsertBudget);
budgetRoutes.post('/copy-previous', copyPreviousMonthBudgets);
budgetRoutes.delete('/:id', deleteBudget);
