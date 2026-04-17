import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { scheduleNotificationsForUser } from '../services/weather/notificationEngine';
import { logger } from '../lib/logger';

export function startNotificationScheduler() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running notification scheduler');
    try {
      const users = await prisma.user.findMany({
        where: {
          locationLat: { not: null },
          locationLng: { not: null },
          lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, locationLat: true, locationLng: true, tier: true },
      });

      for (const user of users) {
        if (!user.locationLat || !user.locationLng) continue;
        try {
          await scheduleNotificationsForUser(user.id, user.locationLat, user.locationLng, user.tier);
        } catch (err) {
          logger.error({ err, userId: user.id }, 'Failed to schedule notifications for user');
        }
      }
      logger.info({ userCount: users.length }, 'Notification scheduler complete');
    } catch (err) {
      logger.error({ err }, 'Notification scheduler failed');
    }
  });
  logger.info('Notification scheduler started');
}
