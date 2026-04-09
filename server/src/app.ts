import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';
import path from 'path';
import { z } from 'zod';
import { env } from './config/env';
import authPlugin from './plugins/auth';
import { isDomainError } from './shared/errors';

import authRoutes from './modules/auth/auth.routes';
import recipeRoutes from './modules/recipe/recipe.routes';
import userRoutes from './modules/user/user.routes';
import { likeRoutes, commentRoutes, followRoutes, savedRoutes, ratingRoutes, notificationRoutes } from './modules/social/social.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import shoppingListRoutes from './modules/shopping-list/shopping-list.routes';
import cookingReportRoutes from './modules/cooking-report/cooking-report.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import collectionRoutes from './modules/collection/collection.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

/** Builds and configures the Fastify application instance. Does not start listening. */
export async function buildApp() {
  const app = Fastify({ logger: env.NODE_ENV !== 'test' });

  // Security & infrastructure plugins
  await app.register(cors, {
    origin: env.CLIENT_URL,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  const isProduction = env.NODE_ENV === 'production';
  const RATE_LIMIT_PRODUCTION = 100;
  const RATE_LIMIT_DEVELOPMENT = 10_000;
  await app.register(rateLimit, {
    max: isProduction ? RATE_LIMIT_PRODUCTION : RATE_LIMIT_DEVELOPMENT,
    timeWindow: '1 minute',
  });
  await app.register(multipart, { limits: { fileSize: FILE_SIZE_LIMIT } });
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });
  await app.register(authPlugin);

  // Global error handler (must be set before routes for encapsulated contexts)
  app.setErrorHandler((error, request, reply) => {
    // Domain errors (NotFoundError, ConflictError, etc.)
    if (isDomainError(error)) {
      return reply.status(error.statusCode).send({ error: { message: error.message, status: error.statusCode } });
    }
    // Zod validation errors
    if (error instanceof z.ZodError || error.name === 'ZodError' || 'issues' in error) {
      const issues = (error as z.ZodError).issues ?? [];
      const message = issues.map((i: z.ZodIssue) => i.message).join(', ');
      return reply.status(400).send({ error: { message, status: 400 } });
    }
    // MongoDB duplicate key errors
    const errorObj = error as Record<string, unknown>;
    if (errorObj.code === 11000) {
      const keyPattern = errorObj.keyPattern as Record<string, unknown> | undefined;
      const field = Object.keys(keyPattern ?? {})[0] || 'field';
      return reply.status(400).send({ error: { message: `Duplicate ${field}`, status: 400 } });
    }
    request.log.error(error);
    return reply.status(500).send({ error: { message: 'Internal Server Error', status: 500 } });
  });

  // Module routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(recipeRoutes, { prefix: '/api/recipes' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(likeRoutes, { prefix: '/api/likes' });
  await app.register(commentRoutes, { prefix: '/api/comments' });
  await app.register(followRoutes, { prefix: '/api/follows' });
  await app.register(savedRoutes, { prefix: '/api/saved' });
  await app.register(ratingRoutes, { prefix: '/api/ratings' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  await app.register(shoppingListRoutes, { prefix: '/api/shopping-list' });
  await app.register(cookingReportRoutes, { prefix: '/api/recipes' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(collectionRoutes, { prefix: '/api/collections' });
  await app.register(gamificationRoutes, { prefix: '/api/gamification' });

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
