import { Router } from 'express';
import {
  contributeGoal,
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
} from '../controllers/goal.controller';
import { authMiddleware } from '../middlewares/auth';

export const goalRoutes = Router();

goalRoutes.use(authMiddleware);

goalRoutes.get('/', listGoals);
goalRoutes.post('/', createGoal);
goalRoutes.put('/:id', updateGoal);
goalRoutes.post('/:id/contribute', contributeGoal);
goalRoutes.delete('/:id', deleteGoal);
