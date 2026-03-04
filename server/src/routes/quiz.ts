import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getQuizPhotos } from '../services/photos/unsplashService';
import { updateGenresMoods, buildStyleProfile } from '../services/profile/styleProfileService';

const router = Router();
router.use(authenticate);

router.get('/photos', async (req: AuthRequest, res, next) => {
  try {
    const round = parseInt(req.query.round as string ?? '0', 10);
    const profile = await prisma.styleProfile.findUnique({ where: { userId: req.userId! } });
    const genres = profile ? (JSON.parse(profile.genres) as string[]) : ['landscape', 'portrait'];
    if (genres.length === 0) genres.push('landscape', 'portrait');

    const photos = await getQuizPhotos(genres, round);
    res.json({ photos, round });
  } catch (err) { next(err); }
});

const GenreMoodSchema = z.object({
  genres: z.array(z.string()).min(1),
  moods: z.array(z.string()).min(1),
});

router.post('/setup', validate(GenreMoodSchema), async (req: AuthRequest, res, next) => {
  try {
    await updateGenresMoods(req.userId!, req.body.genres, req.body.moods);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

const ResponseSchema = z.object({
  photoId: z.string(),
  photoUrl: z.string(),
  photoTags: z.array(z.string()),
  selected: z.boolean(),
  quizRound: z.number().int().min(0),
});

router.post('/response', validate(ResponseSchema), async (req: AuthRequest, res, next) => {
  try {
    const profile = await prisma.styleProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) return res.status(400).json({ error: 'Complete profile setup first' });

    await prisma.photoPreference.create({
      data: {
        userId: req.userId!,
        styleProfileId: profile.id,
        photoId: req.body.photoId,
        photoUrl: req.body.photoUrl,
        photoTags: JSON.stringify(req.body.photoTags),
        selected: req.body.selected,
        quizRound: req.body.quizRound,
      },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/complete', async (req: AuthRequest, res, next) => {
  try {
    // Fire and forget — inference happens in background, return immediately
    buildStyleProfile(req.userId!).catch((e) => console.error('Style inference error:', e));
    res.json({ ok: true, message: 'Style profile building in background' });
  } catch (err) { next(err); }
});

export default router;
