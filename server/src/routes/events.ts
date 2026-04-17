import { Router } from 'express';
import SunCalc from 'suncalc';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { scheduleNotificationsForUser } from '../services/weather/notificationEngine';
import { getCurrentWeather } from '../services/weather/weatherService';

const router = Router();
router.use(authenticate);

router.get('/upcoming', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lat = user.locationLat ?? 51.505;
    const lng = user.locationLng ?? -0.09;

    // Ensure notifications are scheduled
    await scheduleNotificationsForUser(user.id, lat, lng, user.tier);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId!,
        scheduledFor: { gte: new Date() },
        sentAt: null,
      },
      orderBy: { scheduledFor: 'asc' },
      take: 10,
    });

    const weather = await getCurrentWeather(lat, lng);
    const times = SunCalc.getTimes(new Date(), lat, lng);

    const events = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      scheduledFor: n.scheduledFor,
      metadata: JSON.parse(n.metadata),
      requiresPro: ['fog', 'snow', 'clear_night', 'overcast', 'milky_way'].includes(n.type),
    }));

    res.json({
      events,
      currentConditions: {
        weather,
        goldenHourEnd: times.goldenHourEnd,
        sunriseEnd: times.sunriseEnd,
        goldenHour: times.goldenHour,
        sunsetStart: times.sunsetStart,
        dusk: times.dusk,
        lat,
        lng,
      },
    });
  } catch (err) { next(err); }
});

router.post('/:id/open', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: String(req.params.id), userId: req.userId! },
      data: { openedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
