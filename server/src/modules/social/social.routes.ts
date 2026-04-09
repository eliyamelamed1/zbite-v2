import { FastifyInstance } from 'fastify';

import { SocialController } from './social.controller';

// ---------------------------------------------------------------------------
// Each function below registers routes for a single sub-domain.
// The parent (e.g. app.ts) mounts each at the appropriate prefix:
//   fastify.register(likeRoutes, { prefix: '/api/likes' })
//   fastify.register(commentRoutes, { prefix: '/api/comments' })
//   ...
// ---------------------------------------------------------------------------

/** Like routes — mounted at /api/likes. */
export async function likeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/:recipeId', { preHandler: [fastify.authenticate] }, SocialController.likeRecipe);
  fastify.delete('/:recipeId', { preHandler: [fastify.authenticate] }, SocialController.unlikeRecipe);
  fastify.get('/:recipeId/status', { preHandler: [fastify.authenticate] }, SocialController.getLikeStatus);
  fastify.post('/bulk-status', { preHandler: [fastify.authenticate] }, SocialController.getBulkLikeStatus);
}

/** Comment routes — mounted at /api/comments. */
export async function commentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:recipeId', SocialController.getComments);
  fastify.get('/:recipeId/:commentId/replies', SocialController.getCommentReplies);
  fastify.post('/:recipeId', { preHandler: [fastify.authenticate] }, SocialController.createComment);
  fastify.delete('/:commentId', { preHandler: [fastify.authenticate] }, SocialController.deleteComment);
}

/** Follow routes — mounted at /api/follows. */
export async function followRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/:userId', { preHandler: [fastify.authenticate] }, SocialController.followUser);
  fastify.delete('/:userId', { preHandler: [fastify.authenticate] }, SocialController.unfollowUser);
  fastify.get('/:userId/followers', SocialController.getFollowers);
  fastify.get('/:userId/following', SocialController.getFollowing);
  fastify.get('/:userId/status', { preHandler: [fastify.authenticate] }, SocialController.getFollowStatus);
}

/** Saved recipe routes — mounted at /api/saved. */
export async function savedRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [fastify.authenticate] }, SocialController.getSavedRecipes);
  fastify.post('/bulk-status', { preHandler: [fastify.authenticate] }, SocialController.getBulkSaveStatus);
  fastify.post('/:recipeId', { preHandler: [fastify.authenticate] }, SocialController.saveRecipe);
  fastify.delete('/:recipeId', { preHandler: [fastify.authenticate] }, SocialController.unsaveRecipe);
  fastify.get('/:recipeId/status', { preHandler: [fastify.authenticate] }, SocialController.getSaveStatus);
}

/** Rating routes — mounted at /api/ratings. */
export async function ratingRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/:recipeId', { preHandler: [fastify.authenticate] }, SocialController.rateRecipe);
  fastify.get('/:recipeId/me', { preHandler: [fastify.authenticate] }, SocialController.getMyRating);
}

/** Notification routes — mounted at /api/notifications. */
export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [fastify.authenticate] }, SocialController.getNotifications);
  fastify.get('/unread-count', { preHandler: [fastify.authenticate] }, SocialController.getUnreadCount);
  fastify.put('/read', { preHandler: [fastify.authenticate] }, SocialController.markRead);
  fastify.delete('/:notificationId', { preHandler: [fastify.authenticate] }, SocialController.deleteNotification);
}
