import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { logAPICall } from '../../lib/apiLogger';
import { logger } from '../../lib/logger';

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

const PHOTOGRAPHY_TYPES = [
  'park', 'natural_feature', 'point_of_interest', 'tourist_attraction',
  'art_gallery', 'museum', 'church', 'bridge',
];

const STYLE_TAG_MAP: Record<string, string[]> = {
  park: ['landscape', 'nature', 'golden_hour'],
  natural_feature: ['landscape', 'nature'],
  tourist_attraction: ['architecture', 'street'],
  art_gallery: ['architecture', 'minimal'],
  museum: ['architecture', 'minimal'],
  church: ['architecture', 'moody'],
  bridge: ['architecture', 'urban'],
  point_of_interest: ['street', 'urban'],
};

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function getNearbySpots(lat: number, lng: number, radiusM = 3000) {
  // Check DB cache first
  const expiry = new Date();
  const cached = await prisma.spot.findMany({
    where: {
      expiresAt: { gt: expiry },
      latitude: { gte: lat - 0.05, lte: lat + 0.05 },
      longitude: { gte: lng - 0.05, lte: lng + 0.05 },
    },
    take: 20,
  });

  if (cached.length >= 5) {
    return cached.map(formatSpot);
  }

  // Fetch from Google Places
  const start = Date.now();
  try {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius: radiusM,
          type: 'tourist_attraction',
          key: PLACES_KEY,
        },
      },
    );
    await logAPICall({ service: 'google_places', endpoint: 'nearbysearch', latencyMs: Date.now() - start, statusCode: 200 });

    const places = res.data.results?.slice(0, 15) ?? [];
    const spots = [];

    for (const place of places) {
      const types = place.types ?? [];
      const styleTags = [...new Set(types.flatMap((t: string) => STYLE_TAG_MAP[t] ?? []))];
      if (styleTags.length === 0) styleTags.push('street', 'urban');

      const bestTimes = styleTags.includes('landscape')
        ? ['golden_hour', 'blue_hour', 'sunrise']
        : ['golden_hour', 'any'];

      try {
        const spot = await prisma.spot.upsert({
          where: { externalId: place.place_id },
          update: { expiresAt: addDays(1) },
          create: {
            externalId: place.place_id,
            source: 'GOOGLE_PLACES',
            name: place.name,
            description: place.vicinity ?? null,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            styleTags: JSON.stringify(styleTags),
            bestTimes: JSON.stringify(bestTimes),
            photoUrl: place.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${PLACES_KEY}`
              : null,
            rating: place.rating ?? 0,
            ratingCount: place.user_ratings_total ?? 0,
            expiresAt: addDays(1),
          },
        });
        spots.push(formatSpot(spot));
      } catch {
        // Skip duplicate
      }
    }

    return spots;
  } catch (err) {
    await logAPICall({ service: 'google_places', endpoint: 'nearbysearch', latencyMs: Date.now() - start, statusCode: 500 });
    logger.error({ err }, 'Places API failed, using mock data');
    return getMockSpots(lat, lng);
  }
}

function formatSpot(spot: {
  id: string; name: string; description: string | null;
  latitude: number; longitude: number; styleTags: string;
  bestTimes: string; photoUrl: string | null; rating: number;
  ratingCount: number; source: string;
}) {
  return {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    latitude: spot.latitude,
    longitude: spot.longitude,
    styleTags: JSON.parse(spot.styleTags),
    bestTimes: JSON.parse(spot.bestTimes),
    photoUrl: spot.photoUrl,
    rating: spot.rating,
    ratingCount: spot.ratingCount,
    source: spot.source,
  };
}

function getMockSpots(lat: number, lng: number) {
  return [
    {
      id: 'mock-1',
      name: 'City Waterfront',
      description: 'Scenic waterfront area perfect for golden hour',
      latitude: lat + 0.01,
      longitude: lng + 0.01,
      styleTags: ['landscape', 'golden_hour', 'urban'],
      bestTimes: ['golden_hour', 'blue_hour'],
      photoUrl: null,
      rating: 4.5,
      ratingCount: 120,
      source: 'COMMUNITY',
    },
    {
      id: 'mock-2',
      name: 'Historic Bridge',
      description: 'Iconic bridge with great architectural lines',
      latitude: lat - 0.015,
      longitude: lng + 0.02,
      styleTags: ['architecture', 'urban', 'moody'],
      bestTimes: ['golden_hour', 'blue_hour', 'overcast'],
      photoUrl: null,
      rating: 4.8,
      ratingCount: 89,
      source: 'COMMUNITY',
    },
    {
      id: 'mock-3',
      name: 'Central Park',
      description: 'Beautiful park with diverse landscapes',
      latitude: lat + 0.02,
      longitude: lng - 0.01,
      styleTags: ['landscape', 'nature', 'portrait'],
      bestTimes: ['golden_hour', 'sunrise', 'any'],
      photoUrl: null,
      rating: 4.6,
      ratingCount: 203,
      source: 'COMMUNITY',
    },
  ];
}
