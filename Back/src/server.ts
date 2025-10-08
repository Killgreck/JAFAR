import { createApp } from './app';
import { environment } from './config/environment';
import { connectToDatabase, disconnectFromDatabase } from './config/database';

export async function startServer() {
  const app = createApp();
  const port = environment.port;

  await connectToDatabase();

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  const shutdown = async () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('HTTP server closed.');
    });
    await disconnectFromDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
