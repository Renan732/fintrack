import { Router } from 'express';
import {
  changePassword,
  login,
  me,
  register,
  updateProfile,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', authMiddleware, me);
authRoutes.put('/profile', authMiddleware, updateProfile);
authRoutes.put('/password', authMiddleware, changePassword);
