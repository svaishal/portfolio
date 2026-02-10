
import { defineMiddleware } from 'astro:middleware';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

const ipRequests = new Map<string, number[]>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequests.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
    if (validTimestamps.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, validTimestamps);
    }
  }
}, WINDOW_MS);

export const rateLimit = defineMiddleware(async ({ request, clientAddress }, next) => {
  // Only limit API routes
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const ip = clientAddress || 'unknown';
  const now = Date.now();
  
  const timestamps = ipRequests.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  validTimestamps.push(now);
  ipRequests.set(ip, validTimestamps);

  return next();
});
