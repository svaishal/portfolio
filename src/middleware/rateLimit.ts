
import { defineMiddleware } from 'astro:middleware';

// Rate limit configurations
const RATE_LIMITS = {
  default: { windowMs: 60 * 1000, maxRequests: 100 },      // 100 req/min for general API
  login: { windowMs: 30 * 60 * 1000, maxRequests: 5 },    // 5 attempts per 30 min
  contact: { windowMs: 60 * 1000, maxRequests: 5 },       // 5 messages per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 },       // 10 uploads per minute
};

// Separate stores for different rate limit buckets
const stores = {
  default: new Map<string, number[]>(),
  login: new Map<string, { timestamps: number[], lockedUntil?: number }>(),
  contact: new Map<string, number[]>(),
  upload: new Map<string, number[]>(),
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean default store
  for (const [ip, timestamps] of stores.default.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMITS.default.windowMs);
    if (valid.length === 0) stores.default.delete(ip);
    else stores.default.set(ip, valid);
  }
  
  // Clean login store
  for (const [ip, data] of stores.login.entries()) {
    if (data.lockedUntil && now > data.lockedUntil) {
      stores.login.delete(ip);
    } else {
      const valid = data.timestamps.filter(t => now - t < RATE_LIMITS.login.windowMs);
      if (valid.length === 0 && !data.lockedUntil) stores.login.delete(ip);
      else stores.login.set(ip, { ...data, timestamps: valid });
    }
  }
  
  // Clean contact store
  for (const [ip, timestamps] of stores.contact.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMITS.contact.windowMs);
    if (valid.length === 0) stores.contact.delete(ip);
    else stores.contact.set(ip, valid);
  }
  
  // Clean upload store
  for (const [ip, timestamps] of stores.upload.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMITS.upload.windowMs);
    if (valid.length === 0) stores.upload.delete(ip);
    else stores.upload.set(ip, valid);
  }
}, 60 * 1000);

function getRateLimitBucket(pathname: string): keyof typeof RATE_LIMITS {
  if (pathname.includes('/api/auth/login') || pathname.includes('/api/auth/magic-link')) {
    return 'login';
  }
  if (pathname.includes('/api/contact')) {
    return 'contact';
  }
  if (pathname.includes('/api/admin/upload')) {
    return 'upload';
  }
  return 'default';
}

export const rateLimit = defineMiddleware(async ({ request, clientAddress, url }, next) => {
  // Only limit API routes
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const ip = clientAddress || 'unknown';
  const now = Date.now();
  const bucket = getRateLimitBucket(url.pathname);
  const config = RATE_LIMITS[bucket];

  // Special handling for login attempts (includes lockout)
  if (bucket === 'login') {
    const loginData = stores.login.get(ip) || { timestamps: [] };
    
    // Check if locked out
    if (loginData.lockedUntil && now < loginData.lockedUntil) {
      const remainingMinutes = Math.ceil((loginData.lockedUntil - now) / 60000);
      return new Response(JSON.stringify({ 
        error: 'Too many login attempts',
        message: `Account locked. Try again in ${remainingMinutes} minutes.`,
        lockedUntil: loginData.lockedUntil
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((loginData.lockedUntil - now) / 1000))
        }
      });
    }
    
    const validTimestamps = loginData.timestamps.filter(t => now - t < config.windowMs);
    
    if (validTimestamps.length >= config.maxRequests) {
      // Lock out for 30 minutes
      stores.login.set(ip, { 
        timestamps: validTimestamps, 
        lockedUntil: now + 30 * 60 * 1000 
      });
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
    
    validTimestamps.push(now);
    stores.login.set(ip, { timestamps: validTimestamps });
    return next();
  }
  
  // Standard rate limiting for other buckets
  const store = stores[bucket];
  const timestamps = store.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < config.windowMs);

  if (validTimestamps.length >= config.maxRequests) {
    return new Response(JSON.stringify({ 
      error: 'Too many requests',
      message: `Rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`
    }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(config.windowMs / 1000))
      }
    });
  }

  validTimestamps.push(now);
  store.set(ip, validTimestamps);

  return next();
});
