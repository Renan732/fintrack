import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth';

export const categoryRoutes = Router();

categoryRoutes.use(authMiddleware);

categoryRoutes.get('/', listCategories);
categoryRoutes.post('/', createCategory);
categoryRoutes.put('/:id', updateCategory);
categoryRoutes.delete('/:id', deleteCategory);
