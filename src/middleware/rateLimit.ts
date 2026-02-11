import { defineMiddleware } from 'astro:middleware';

// Rate limit configurations
const RATE_LIMITS = {
  default: { windowMs: 60 * 1000, maxRequests: 100 },      // 100 req/min for general API
  login: { windowMs: 30 * 60 * 1000, maxRequests: 5 },    // 5 attempts per 30 min (plus lockout)
  contact: { windowMs: 60 * 1000, maxRequests: 5 },       // 5 messages per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 },       // 10 uploads per minute
};

// --- Store Interface ---
interface RateLimitResult {
  current: number;
  reset: number;
  blocked?: boolean;
  blockedUntil?: number;
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitResult>;
  block(key: string, durationMs: number): Promise<void>;
  isBlocked(key: string): Promise<{ blocked: boolean; until?: number }>;
}

// --- Memory Store (Fallback) ---
// Note: In serverless, this memory is not shared across lambda instances.
class MemoryStore implements RateLimitStore {
  private hits = new Map<string, number[]>();
  private blocks = new Map<string, number>();

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const timestamps = this.hits.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    validTimestamps.push(now);
    this.hits.set(key, validTimestamps);
    
    // Cleanup periodically (simple piggyback cleanup)
    if (Math.random() < 0.01) { 
        this.cleanup(windowMs);
    }

    return {
      current: validTimestamps.length,
      reset: now + windowMs,
    };
  }

  async block(key: string, durationMs: number): Promise<void> {
    this.blocks.set(key, Date.now() + durationMs);
  }

  async isBlocked(key: string): Promise<{ blocked: boolean; until?: number }> {
    const until = this.blocks.get(key);
    if (until && Date.now() < until) {
      return { blocked: true, until };
    }
    return { blocked: false };
  }

  private cleanup(windowMs: number) {
      const now = Date.now();
      for (const [key, timestamps] of this.hits.entries()) {
          const valid = timestamps.filter(t => now - t < windowMs);
          if (valid.length === 0) this.hits.delete(key);
          else this.hits.set(key, valid);
      }
      for (const [key, until] of this.blocks.entries()) {
          if (now > until) this.blocks.delete(key);
      }
  }
}

// --- Upstash/Vercel KV Store (Redis over HTTP) ---
class UpstashRedisStore implements RateLimitStore {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async command(command: string[]) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(command),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    // Use a sorted set to store timestamps. 
    // ZREMRANGEBYSCORE to remove old. ZADD to add new. ZCARD to count.
    // Pipeline for atomicity.
    const keyName = `rate:${key}`;
    const windowStart = now - windowMs;

    try {
        // We use a simplified approach: usage counter with expire
        // ZSET is better for sliding window, but List/Counter is simpler.
        // Let's stick to sliding window using ZSET (Sorted Set)
        const commands = [
            ['ZREMRANGEBYSCORE', keyName, 0, windowStart],
            ['ZADD', keyName, now, now], // score=timestamp, member=timestamp (unique enough? maybe add random salt if high concurrency, but fine for IP)
            ['ZCARD', keyName],
            ['EXPIRE', keyName, Math.ceil(windowMs / 1000) + 60] // Expire key after window + buffer
        ];
        
        // This requires 'pipeline' endpoint or multiple requests. Upstash REST supports pipeline.
        const res = await fetch(`${this.url}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.token}` },
            body: JSON.stringify(commands)
        });
        const data = await res.json();
        const count = data[2].result; // Result of ZCARD

        return {
            current: count,
            reset: now + windowMs
        };
    } catch (e) {
        console.error('Redis increment error, falling back to allow', e);
        return { current: 1, reset: now + windowMs };
    }
  }

  async block(key: string, durationMs: number): Promise<void> {
      const keyName = `block:${key}`;
      await this.command(['SET', keyName, '1', 'PX', String(durationMs)]);
  }

  async isBlocked(key: string): Promise<{ blocked: boolean; until?: number }> {
      const keyName = `block:${key}`;
      const ttl = await this.command(['PTTL', keyName]); // Returns ms remaining
      
      if (ttl > 0) {
          return { blocked: true, until: Date.now() + ttl };
      }
      return { blocked: false };
  }
}

// Select Store
const getStore = (): RateLimitStore => {
    // Check for Vercel KV or Upstash Redis Env Vars
    const url = import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
    const token = import.meta.env.KV_REST_API_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        // console.log('Using Distributed Redis Store for Rate Limiting');
        return new UpstashRedisStore(url, token);
    }
    
    // console.log('Using In-Memory Store for Rate Limiting (Not distributed-safe)');
    return new MemoryStore();
};

const store = getStore();

function getRateLimitBucket(pathname: string): keyof typeof RATE_LIMITS {
  if (pathname.includes('/api/auth/login') || pathname.includes('/api/auth/magic-link')) return 'login';
  if (pathname.includes('/api/contact')) return 'contact';
  if (pathname.includes('/api/admin/upload')) return 'upload';
  return 'default';
}

export const rateLimit = defineMiddleware(async ({ request, clientAddress, url }, next) => {
  // Only limit API routes
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const ip = clientAddress || 'unknown';
  const bucket = getRateLimitBucket(url.pathname);
  const config = RATE_LIMITS[bucket];

  // Bucket specific key
  const key = `${bucket}:${ip}`;

  // 1. Check if blocked (only for login usually, but good generic protection)
  if (bucket === 'login') {
      const { blocked, until } = await store.isBlocked(key);
      if (blocked && until) {
          const remainingMinutes = Math.ceil((until - Date.now()) / 60000);
          return new Response(JSON.stringify({ 
            error: 'Too many attempts',
            message: `Account locked. Try again in ${remainingMinutes} minutes.`,
            lockedUntil: until
          }), {
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((until - Date.now()) / 1000))
            }
          });
      }
  }

  // 2. Increment and check limit
  const { current, reset } = await store.increment(key, config.windowMs);

  if (current > config.maxRequests) {
      // If login, block for longer
      if (bucket === 'login') {
          await store.block(key, 30 * 60 * 1000); // 30 min block
          return new Response(JSON.stringify({ 
            error: 'Too many login attempts',
            message: 'Account locked for 30 minutes due to too many failed attempts.'
          }), {
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '1800'
            }
          });
      }

      return new Response(JSON.stringify({ 
        error: 'Too many requests',
        message: `Rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000))
        }
      });
  }

  return next();
});
