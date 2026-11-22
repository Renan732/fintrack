import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { apiRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'FinTrack API',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      status: 'error',
      service: 'FinTrack API',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api', apiRoutes);

// Rota não encontrada (404)
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Middleware centralizado de tratamento de erros
app.use(errorHandler);
