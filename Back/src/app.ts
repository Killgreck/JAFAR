import express from 'express';
import cors from 'cors';
import { httpLogger } from './core/httpLogger';
import { usersRouter } from './modules/users/routes';
import { betsRouter } from './modules/bets/routes';
import { walletRouter } from './modules/wallet/routes';

type ErrorWithStatus = Error & { status?: number };

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(httpLogger);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/users', usersRouter);
  app.use('/api/bets', betsRouter);
  app.use('/api/wallet', walletRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  app.use((err: ErrorWithStatus, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? 500;
    res.status(status).json({ message: err.message ?? 'Internal Server Error' });
  });

  return app;
}
