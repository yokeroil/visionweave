import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const EventSchema = z.object({
  events: z.array(z.object({
    eventType: z.string(),
    properties: z.record(z.unknown()).default({}),
    latencyMs: z.number().optional(),
    createdAt: z.string().optional(),
  })).min(1).max(50),
});

router.post('/events', authenticate, validate(EventSchema), async (req: AuthRequest, res, next) => {
  try {
    await prisma.telemetryEvent.createMany({
      data: req.body.events.map((e: { eventType: string; properties: Record<string, unknown>; latencyMs?: number }) => ({
        eventType: e.eventType,
        userId: req.userId,
        properties: JSON.stringify(e.properties),
        latencyMs: e.latencyMs,
      })),
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Metrics dashboard (local dev only)
router.get('/metrics', async (_req, res, next) => {
  try {
    const [totalUsers, totalSessions, recentEvents, apiCosts] = await Promise.all([
      prisma.user.count(),
      prisma.cameraSession.count(),
      prisma.telemetryEvent.groupBy({ by: ['eventType'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
      prisma.aPICallLog.aggregate({ _sum: { costEstimate: true }, _count: { id: true } }),
    ]);

    const quizCompleted = await prisma.telemetryEvent.count({ where: { eventType: 'quiz.completed' } });
    const quizStarted = await prisma.telemetryEvent.count({ where: { eventType: 'quiz.genre_selected' } });
    const notifSent = await prisma.notification.count({ where: { sentAt: { not: null } } });
    const notifOpened = await prisma.notification.count({ where: { openedAt: { not: null } } });
    const rollups = await prisma.dailyMetricRollup.findMany({ orderBy: { date: 'desc' }, take: 30 });

    res.json({
      summary: {
        totalUsers,
        totalCameraSessions: totalSessions,
        quizCompletionRate: quizStarted > 0 ? Math.round((quizCompleted / quizStarted) * 100) : 0,
        notificationOpenRate: notifSent > 0 ? Math.round((notifOpened / notifSent) * 100) : 0,
        totalAPICalls: apiCosts._count.id,
        totalAPICostUSD: (apiCosts._sum.costEstimate ?? 0).toFixed(4),
      },
      eventBreakdown: recentEvents.map((e) => ({ event: e.eventType, count: e._count.id })),
      rollups,
    });
  } catch (err) { next(err); }
});

export default router;
