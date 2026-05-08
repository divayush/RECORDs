import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { dealsRouter } from './routes/deals.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { statsRouter } from './routes/stats.routes.js';

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS.'));
    },
  }),
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'Deal Ledger API',
    status: 'running',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/deals', authMiddleware, dealsRouter);
app.use('/api/stats', authMiddleware, statsRouter);
app.use('/api/health', healthRouter);
app.use(errorMiddleware);
