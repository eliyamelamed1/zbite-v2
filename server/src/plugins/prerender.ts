import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import https from 'https';
import { env } from '../config/env';

/**
 * Bot user-agent patterns for crawlers that don't execute JavaScript.
 * These crawlers see an empty SPA shell without pre-rendering.
 */
const BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'duckduckbot',
  'slurp',
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'gptbot',
  'claudebot',
  'perplexitybot',
  'chatgpt-user',
  'google-inspectiontool',
];

const PRERENDER_SERVICE_URL = 'https://service.prerender.io/';

/** Checks whether a request comes from a known bot based on User-Agent. */
function isBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return BOT_PATTERNS.some((pattern) => lowerUA.includes(pattern));
}

/** Checks whether the request path should be pre-rendered (skip static assets and API routes). */
function shouldPrerender(url: string): boolean {
  if (url.startsWith('/api/')) return false;
  if (url.startsWith('/uploads/')) return false;
  if (url === '/sitemap.xml') return false;
  if (url === '/robots.txt') return false;

  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.map'];
  return !staticExtensions.some((ext) => url.endsWith(ext));
}

/**
 * Fetches a pre-rendered HTML snapshot from Prerender.io.
 * Returns the HTML string or null if the request fails.
 */
function fetchPrerenderedPage(targetUrl: string, token: string): Promise<string | null> {
  return new Promise((resolve) => {
    const prerenderUrl = `${PRERENDER_SERVICE_URL}${targetUrl}`;

    const request = https.get(prerenderUrl, {
      headers: { 'X-Prerender-Token': token },
    }, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        resolve(null);
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });

    request.on('error', () => resolve(null));

    const TIMEOUT_MS = 10_000;
    request.setTimeout(TIMEOUT_MS, () => {
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Prerender plugin — intercepts bot requests and serves pre-rendered HTML from Prerender.io.
 * Requires PRERENDER_TOKEN env var to be set. If not set, the plugin is a no-op.
 */
async function prerenderPlugin(fastify: FastifyInstance): Promise<void> {
  const token = env.PRERENDER_TOKEN;

  if (!token) {
    fastify.log.info('PRERENDER_TOKEN not set — prerender middleware disabled');
    return;
  }

  fastify.log.info('Prerender middleware enabled');

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const userAgent = request.headers['user-agent'] ?? '';
    if (!isBot(userAgent)) return;
    if (!shouldPrerender(request.url)) return;

    const protocol = request.protocol ?? 'https';
    const host = request.hostname;
    const fullUrl = `${protocol}://${host}${request.url}`;

    request.log.info({ bot: userAgent, url: fullUrl }, 'Serving pre-rendered page to bot');

    const html = await fetchPrerenderedPage(fullUrl, token);
    if (!html) return; // Fall through to normal SPA if prerender fails

    return reply
      .type('text/html')
      .header('X-Prerender', 'true')
      .send(html);
  });
}

export default fp(prerenderPlugin, { name: 'prerender' });
