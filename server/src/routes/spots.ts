import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateQuery, validate } from '../middleware/validate';
import { getNearbySpots } from '../services/spots/placesService';

const router = Router();
router.use(authenticate);

const NearbyQuery = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number),
  radius: z.string().transform(Number).default('3000'),
});

router.get('/nearby', validateQuery(NearbyQuery), async (req: AuthRequest, res, next) => {
  try {
    const { lat, lng, radius } = req.query as unknown as z.infer<typeof NearbyQuery>;
    const spots = await getNearbySpots(lat, lng, radius);

    // Track view
    await prisma.user.update({ where: { id: req.userId }, data: { locationLat: lat, locationLng: lng } });

    res.json({ spots });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const spot = await prisma.spot.findFirst({ where: { id: String(req.params.id) } });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    await prisma.userSpotView.upsert({
      where: { userId_spotId: { userId: req.userId!, spotId: spot.id } },
      update: { viewedAt: new Date() },
      create: { userId: req.userId!, spotId: spot.id },
    });

    res.json({
      spot: {
        ...spot,
        styleTags: JSON.parse(spot.styleTags),
        bestTimes: JSON.parse(spot.bestTimes),
      },
    });
  } catch (err) { next(err); }
});

const SpotSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  styleTags: z.array(z.string()),
  bestTimes: z.array(z.string()),
});

router.post('/', validate(SpotSchema), async (req: AuthRequest, res, next) => {
  try {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10); // Community spots live long

    const spot = await prisma.spot.create({
      data: {
        externalId: `community-${req.userId}-${Date.now()}`,
        source: 'COMMUNITY',
        name: req.body.name,
        description: req.body.description,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        styleTags: JSON.stringify(req.body.styleTags),
        bestTimes: JSON.stringify(req.body.bestTimes),
        expiresAt,
      },
    });
    res.status(201).json({ spot });
  } catch (err) { next(err); }
});

export default router;
