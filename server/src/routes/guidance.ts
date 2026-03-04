import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { generateGuidance, SceneContext } from '../services/ai/guidanceGen';
import { DEFAULT_VECTOR, StyleVector } from '../services/ai/styleInference';

const router = Router();
router.use(authenticate);

const SceneQuerySchema = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number),
  sunAzimuth: z.string().transform(Number),
  sunAltitude: z.string().transform(Number),
  isGoldenHour: z.string().transform((v) => v === 'true'),
  isBlueHour: z.string().transform((v) => v === 'true'),
  sceneLabel: z.string().default('Daylight'),
  weatherCondition: z.string().optional(),
});

router.get('/scene', validateQuery(SceneQuerySchema), async (req: AuthRequest, res, next) => {
  try {
    const q = req.query as unknown as z.infer<typeof SceneQuerySchema>;

    const profile = await prisma.styleProfile.findUnique({ where: { userId: req.userId! } });
    const styleVector: StyleVector = profile
      ? (JSON.parse(profile.styleVector) as StyleVector)
      : DEFAULT_VECTOR;

    const scene: SceneContext = {
      sceneLabel: q.sceneLabel,
      sunAzimuth: q.sunAzimuth,
      sunAltitude: q.sunAltitude,
      isGoldenHour: q.isGoldenHour,
      isBlueHour: q.isBlueHour,
      weatherCondition: q.weatherCondition,
    };

    const guidance = await generateGuidance(scene, styleVector);
    res.json(guidance);
  } catch (err) { next(err); }
});

// Start / end camera session
router.post('/session/start', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lng, sceneContext } = req.body;
    const session = await prisma.cameraSession.create({
      data: {
        userId: req.userId!,
        locationLat: lat,
        locationLng: lng,
        sceneContext: sceneContext ? JSON.stringify(sceneContext) : null,
      },
    });
    res.json({ sessionId: session.id });
  } catch (err) { next(err); }
});

router.post('/session/:id/end', async (req: AuthRequest, res, next) => {
  try {
    const { overlaysShown, overlaysUsed } = req.body;
    await prisma.cameraSession.updateMany({
      where: { id: String(req.params.id), userId: req.userId! },
      data: { endedAt: new Date(), overlaysShown, overlaysUsed },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
