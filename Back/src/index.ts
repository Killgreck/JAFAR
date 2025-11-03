/**
 * Main entry point for the application.
 */

import { startServer } from './server';

startServer().catch((error) => {
  console.error('Failed to start server', error);
});
