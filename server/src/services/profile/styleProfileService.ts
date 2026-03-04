import { prisma } from '../../lib/prisma';
import { inferStyleProfile, DEFAULT_VECTOR } from '../ai/styleInference';
import { logger } from '../../lib/logger';

export async function getOrCreateProfile(userId: string) {
  return prisma.styleProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      genres: JSON.stringify([]),
      moods: JSON.stringify([]),
      styleVector: JSON.stringify(DEFAULT_VECTOR),
      styleSummary: '',
      confidence: 0,
    },
  });
}

export async function updateGenresMoods(userId: string, genres: string[], moods: string[]) {
  return prisma.styleProfile.upsert({
    where: { userId },
    update: { genres: JSON.stringify(genres), moods: JSON.stringify(moods) },
    create: {
      userId,
      genres: JSON.stringify(genres),
      moods: JSON.stringify(moods),
      styleVector: JSON.stringify(DEFAULT_VECTOR),
      styleSummary: '',
      confidence: 0,
    },
  });
}

export async function buildStyleProfile(userId: string): Promise<void> {
  const profile = await prisma.styleProfile.findUnique({ where: { userId } });
  if (!profile) {
    logger.warn({ userId }, 'No profile found for inference');
    return;
  }

  const preferences = await prisma.photoPreference.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  const genres = JSON.parse(profile.genres) as string[];
  const moods = JSON.parse(profile.moods) as string[];
  const quizPhotos = preferences.map((p) => ({
    photoId: p.photoId,
    tags: JSON.parse(p.photoTags) as string[],
    selected: p.selected,
  }));

  logger.info({ userId, photoCount: quizPhotos.length }, 'Running style inference');

  const { vector, summary } = await inferStyleProfile(genres, moods, quizPhotos);

  const confidence = Math.min(0.95, 0.3 + quizPhotos.filter((p) => p.selected).length * 0.05);

  await prisma.styleProfile.update({
    where: { userId },
    data: {
      styleVector: JSON.stringify(vector),
      styleSummary: summary,
      confidence,
      version: { increment: 1 },
    },
  });

  logger.info({ userId, summary, confidence }, 'Style profile updated');
}

export async function getStyleSummary(userId: string) {
  const profile = await prisma.styleProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  const vector = JSON.parse(profile.styleVector) as Record<string, number>;
  const topTags = Object.entries(vector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);
  return {
    summary: profile.styleSummary,
    vector,
    genres: JSON.parse(profile.genres),
    moods: JSON.parse(profile.moods),
    topTags,
    confidence: profile.confidence,
    version: profile.version,
    quizComplete: profile.confidence > 0,
  };
}
