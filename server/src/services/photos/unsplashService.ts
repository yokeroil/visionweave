import axios from 'axios';
import { cacheGet, cacheSet, TTL } from '../../lib/cache';
import { logAPICall } from '../../lib/apiLogger';
import { logger } from '../../lib/logger';

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const BASE = 'https://api.unsplash.com';

export interface QuizPhoto {
  id: string;
  url: string;
  thumb: string;
  tags: string[];
  alt: string;
}

const SEARCH_QUERIES: Record<string, { query: string; tags: string[] }[]> = {
  landscape: [
    { query: 'golden hour landscape', tags: ['landscape', 'golden_hour', 'warm_tones'] },
    { query: 'blue hour city', tags: ['landscape', 'blue_hour', 'cool_tones', 'urban'] },
    { query: 'misty forest morning', tags: ['landscape', 'nature', 'moody', 'film_grain'] },
    { query: 'minimalist landscape', tags: ['landscape', 'minimal', 'bright_airy'] },
  ],
  portrait: [
    { query: 'portrait natural light golden', tags: ['portrait', 'golden_hour', 'warm_tones'] },
    { query: 'street portrait moody', tags: ['portrait', 'street', 'moody'] },
    { query: 'environmental portrait', tags: ['portrait', 'landscape', 'minimal'] },
    { query: 'soft light portrait', tags: ['portrait', 'bright_airy', 'minimal'] },
  ],
  street: [
    { query: 'street photography rain night', tags: ['street', 'moody', 'urban', 'cool_tones'] },
    { query: 'street golden hour', tags: ['street', 'golden_hour', 'warm_tones'] },
    { query: 'street photography film', tags: ['street', 'film_grain', 'moody'] },
    { query: 'street minimal urban', tags: ['street', 'minimal', 'architecture'] },
  ],
  architecture: [
    { query: 'architecture blue hour', tags: ['architecture', 'blue_hour', 'cool_tones'] },
    { query: 'minimalist architecture', tags: ['architecture', 'minimal', 'bright_airy'] },
    { query: 'architecture moody dramatic', tags: ['architecture', 'moody', 'film_grain'] },
    { query: 'church cathedral interior', tags: ['architecture', 'moody', 'minimal'] },
  ],
  astro: [
    { query: 'milky way stars night', tags: ['astro', 'landscape', 'cool_tones', 'moody'] },
    { query: 'starry sky mountains', tags: ['astro', 'landscape', 'minimal'] },
    { query: 'aurora borealis', tags: ['astro', 'cool_tones', 'vibrant'] },
    { query: 'moon photography', tags: ['astro', 'minimal', 'cool_tones'] },
  ],
};

export async function getQuizPhotos(genres: string[], round: number): Promise<QuizPhoto[]> {
  const cacheKey = `quiz:photos:${genres.join('-')}:r${round}`;
  const cached = cacheGet<QuizPhoto[]>(cacheKey);
  if (cached) return cached;

  const queries: { query: string; tags: string[] }[] = [];
  for (const genre of genres) {
    const options = SEARCH_QUERIES[genre] ?? SEARCH_QUERIES.landscape;
    queries.push(...options);
  }

  // Shuffle and pick 4 for this round
  const shuffled = queries.sort(() => Math.random() - 0.5);
  const picks = shuffled.slice((round * 4) % shuffled.length, (round * 4) % shuffled.length + 4);
  if (picks.length < 4) picks.push(...shuffled.slice(0, 4 - picks.length));

  const photos: QuizPhoto[] = [];
  const start = Date.now();

  for (const pick of picks.slice(0, 4)) {
    try {
      const res = await axios.get(`${BASE}/search/photos`, {
        params: { query: pick.query, per_page: 5, orientation: 'portrait' },
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      });
      await logAPICall({ service: 'unsplash', endpoint: 'search', latencyMs: Date.now() - start, statusCode: 200 });

      const results = res.data.results;
      if (results?.length > 0) {
        const photo = results[Math.floor(Math.random() * Math.min(results.length, 3))];
        photos.push({
          id: photo.id,
          url: photo.urls.regular,
          thumb: photo.urls.thumb,
          tags: pick.tags,
          alt: photo.alt_description ?? pick.query,
        });
      }
    } catch (err) {
      await logAPICall({ service: 'unsplash', endpoint: 'search', latencyMs: Date.now() - start, statusCode: 500 });
      logger.error({ err, query: pick.query }, 'Unsplash fetch failed, using fallback');
      // Fallback gradient placeholder
      photos.push({
        id: `fallback-${Date.now()}-${Math.random()}`,
        url: '',
        thumb: '',
        tags: pick.tags,
        alt: pick.query,
      });
    }
  }

  cacheSet(cacheKey, photos, TTL.quizPhotos);
  return photos;
}
