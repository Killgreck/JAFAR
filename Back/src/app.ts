import express from 'express';
import cors from 'cors';
import path from 'path';
import { httpLogger } from './core/httpLogger';
import { usersRouter } from './modules/users/routes';
import { betsRouter } from './modules/bets/routes';
import { wagersRouter } from './modules/wagers/routes';
import { walletRouter } from './modules/wallet/routes';
import { eventsRouter } from './modules/events/routes';
import { curatorsRouter } from './modules/curators/routes';
import { eventWagersRouter } from './modules/event-wagers/routes';

type ErrorWithStatus = Error & { status?: number };

/**
 * Creates and configures an Express application.
 * @returns The configured Express application.
 */
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
  app.use('/api/wagers', wagersRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/curators', curatorsRouter);
  app.use('/api/event-wagers', eventWagersRouter);

  // Serve static files from the React app
  const frontendPath = path.join(__dirname, '../../Front/dist');
  app.use(express.static(frontendPath));

  // All other GET requests not handled before will return our React app
  app.use((_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.use((err: ErrorWithStatus, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? 500;
    res.status(status).json({ message: err.message ?? 'Internal Server Error' });
  });

  return app;
}
