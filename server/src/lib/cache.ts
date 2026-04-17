import NodeCache from 'node-cache';

export const TTL = {
  guidance: 15 * 60,
  styleInference: 7 * 24 * 3600,
  weatherData: 30 * 60,
  placesNearby: 24 * 3600,
  quizPhotos: 7 * 24 * 3600,
};

const cache = new NodeCache({ checkperiod: 120 });

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl: number): void {
  cache.set(key, value, ttl);
}

export function cacheDel(key: string): void {
  cache.del(key);
}

export function cacheStats() {
  return cache.getStats();
}
