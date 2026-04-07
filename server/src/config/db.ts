import mongoose from 'mongoose';
import { env } from './env';

/** Connects to MongoDB using the URI from environment config. */
export async function connectDB(): Promise<void> {
  const conn = await mongoose.connect(env.MONGODB_URI);
  // Log is intentionally console here — Fastify logger isn't available yet at DB connect time
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${conn.connection.host}`);
}
