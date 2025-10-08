import { startServer } from './server';

startServer().catch((error) => {
  console.error('Failed to start server', error);
});
