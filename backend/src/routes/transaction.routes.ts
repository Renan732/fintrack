import { Router } from 'express';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth';

export const transactionRoutes = Router();

transactionRoutes.use(authMiddleware);

transactionRoutes.get('/', listTransactions);
transactionRoutes.post('/', createTransaction);
transactionRoutes.put('/:id', updateTransaction);
transactionRoutes.delete('/:id', deleteTransaction);
