import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getStyleSummary } from '../services/profile/styleProfileService';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, locale: true, tier: true, locationLat: true, locationLng: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  locale: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
});

router.put('/', validate(UpdateSchema), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: req.body,
      select: { id: true, email: true, name: true, locale: true, tier: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
});

router.get('/style', async (req: AuthRequest, res, next) => {
  try {
    const summary = await getStyleSummary(req.userId!);
    res.json({ style: summary });
  } catch (err) { next(err); }
});

router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const [sessions, spotViews, quizRounds] = await Promise.all([
      prisma.cameraSession.count({ where: { userId: req.userId } }),
      prisma.userSpotView.count({ where: { userId: req.userId } }),
      prisma.photoPreference.count({ where: { userId: req.userId } }),
    ]);
    res.json({ sessions, spotViews, quizRounds });
  } catch (err) { next(err); }
});

router.get('/progress', async (req: AuthRequest, res, next) => {
  try {
    const [sessions, spotViews, profile] = await Promise.all([
      prisma.cameraSession.count({ where: { userId: req.userId } }),
      prisma.userSpotView.count({ where: { userId: req.userId } }),
      prisma.styleProfile.findUnique({ where: { userId: req.userId! } }),
    ]);

    const stylesExplored = profile
      ? Object.entries(JSON.parse(profile.styleVector) as Record<string, number>)
          .filter(([, v]) => v > 0.5).length
      : 0;

    res.json({ shootsThisMonth: sessions, spotsVisited: spotViews, stylesExplored });
  } catch (err) { next(err); }
});

export default router;
