import { env } from './config/env';
import { connectDB } from './config/db';
import { buildApp } from './app';

async function start(): Promise<void> {
  await connectDB();
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`Server running on port ${env.PORT}`);
}

start().catch((err) => {
  // eslint-disable-next-line no-console -- startup error before logger is available
  console.error('Failed to start server:', err);
  process.exit(1);
});
