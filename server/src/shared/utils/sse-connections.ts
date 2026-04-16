import { FastifyReply } from 'fastify';

/**
 * In-memory SSE connection registry.
 * Maps userId → Set of active SSE reply streams.
 * Each user can have multiple tabs open, each with its own connection.
 */
const connections = new Map<string, Set<FastifyReply>>();

const HEARTBEAT_INTERVAL_MS = 30_000;

/** Register a new SSE connection for a user. Returns a cleanup function. */
export function addConnection(userId: string, reply: FastifyReply): () => void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(reply); // eslint-disable-line @typescript-eslint/no-non-null-assertion

  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    clearInterval(heartbeat);
    const userSet = connections.get(userId);
    if (userSet) {
      userSet.delete(reply);
      if (userSet.size === 0) {
        connections.delete(userId);
      }
    }
  };

  // Heartbeat to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      reply.raw.write(':heartbeat\n\n');
    } catch {
      cleanup();
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Auto-cleanup on disconnect or socket error
  reply.raw.on('close', cleanup);
  reply.raw.on('error', cleanup);

  return cleanup;
}

/** Send an SSE event to all of a user's active connections. Non-blocking — never throws. */
export function sendToUser(userId: string, event: string, data: unknown): void {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const reply of userConnections) {
    try {
      reply.raw.write(payload);
    } catch {
      // Connection may be stale — will be cleaned up on next heartbeat failure
    }
  }
}
