import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

async function rollup(date: string) {
  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [dau, newUsers, sessions] = await Promise.all([
    prisma.user.count({ where: { lastActiveAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.cameraSession.count({ where: { startedAt: { gte: dayStart, lt: dayEnd } } }),
  ]);

  const quizStart = await prisma.telemetryEvent.count({
    where: { eventType: 'quiz.genre_selected', createdAt: { gte: dayStart, lt: dayEnd } },
  });
  const quizDone = await prisma.telemetryEvent.count({
    where: { eventType: 'quiz.completed', createdAt: { gte: dayStart, lt: dayEnd } },
  });
  const notifSent = await prisma.notification.count({
    where: { sentAt: { gte: dayStart, lt: dayEnd } },
  });
  const notifOpened = await prisma.notification.count({
    where: { openedAt: { gte: dayStart, lt: dayEnd } },
  });
  const apiCosts = await prisma.aPICallLog.aggregate({
    where: { createdAt: { gte: dayStart, lt: dayEnd } },
    _sum: { costEstimate: true },
  });

  const metrics = [
    { metric: 'dau', value: dau },
    { metric: 'new_users', value: newUsers },
    { metric: 'camera_sessions', value: sessions },
    { metric: 'quiz_completion_rate', value: quizStart > 0 ? quizDone / quizStart : 0 },
    { metric: 'notif_open_rate', value: notifSent > 0 ? notifOpened / notifSent : 0 },
    { metric: 'api_cost_usd', value: apiCosts._sum.costEstimate ?? 0 },
  ];

  for (const m of metrics) {
    await prisma.dailyMetricRollup.upsert({
      where: { date_metric: { date, metric: m.metric } },
      update: { value: m.value },
      create: { date, metric: m.metric, value: m.value },
    });
  }
  logger.info({ date, metrics: metrics.length }, 'Metrics rolled up');
}

export function startMetricsRollup() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await rollup(yesterday.toISOString().slice(0, 10));
  });
  logger.info('Metrics rollup job started');
}
