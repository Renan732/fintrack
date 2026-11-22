import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth';

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

dashboardRoutes.get('/summary', getDashboardSummary);
