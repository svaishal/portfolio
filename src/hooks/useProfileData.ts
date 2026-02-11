import { getPortfolioData, type PortfolioData } from '../lib/data';

interface UseProfileDataOptions {
  client?: any;
  useDraft?: boolean;
  cacheKey?: string;
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds (was 5 mins)
const profileDataCache = new Map<string, { data: PortfolioData; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<PortfolioData>>();

function buildCacheKey(options: UseProfileDataOptions): string {
  if (options.cacheKey) return options.cacheKey;
  return options.useDraft ? 'draft' : 'live';
}

export async function useProfileData(options: UseProfileDataOptions = {}): Promise<PortfolioData> {
  const cacheKey = buildCacheKey(options);
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();

  const cached = profileDataCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = getPortfolioData(options.client, options.useDraft)
    .then((data) => {
      profileDataCache.set(cacheKey, { data, expiresAt: Date.now() + ttlMs });
      inflightRequests.delete(cacheKey);
      return data;
    })
    .catch((error) => {
      inflightRequests.delete(cacheKey);
      throw error;
    });

  inflightRequests.set(cacheKey, request);
  return request;
}
