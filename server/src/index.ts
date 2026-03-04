import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import quizRoutes from './routes/quiz';
import guidanceRoutes from './routes/guidance';
import spotsRoutes from './routes/spots';
import eventsRoutes from './routes/events';
import telemetryRoutes from './routes/telemetry';
import { startNotificationScheduler } from './jobs/notificationScheduler';
import { startMetricsRollup } from './jobs/metricsRollup';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      db: 'connected',
      aiKey: !!process.env.ANTHROPIC_API_KEY,
      weatherKey: !!process.env.OPENWEATHER_API_KEY,
      placesKey: !!process.env.GOOGLE_PLACES_API_KEY,
      unsplashKey: !!process.env.UNSPLASH_ACCESS_KEY,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/quiz', quizRoutes);
app.use('/guidance', guidanceRoutes);
app.use('/spots', spotsRoutes);
app.use('/events', eventsRoutes);
app.use('/telemetry', telemetryRoutes);

// Error handler
app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info({ port: PORT }, `VisionWeave server running on http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics:      http://localhost:${PORT}/telemetry/metrics`);
    });

    startNotificationScheduler();
    startMetricsRollup();
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
