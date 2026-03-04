import SunCalc from 'suncalc';
import { prisma } from '../../lib/prisma';
import { getForecast, getCurrentWeather } from './weatherService';
import { logger } from '../../lib/logger';

interface ShootEvent {
  type: string;
  title: string;
  body: string;
  scheduledFor: Date;
  metadata: object;
  requiresPro: boolean;
}

function getGoldenBlueHourEvents(lat: number, lng: number, days = 3): ShootEvent[] {
  const events: ShootEvent[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const times = SunCalc.getTimes(date, lat, lng);

    const goldenHourAM = times.goldenHour;
    const goldenHourPM = times.sunsetStart;
    const blueHourAM = times.nauticalDawn;
    const blueHourPM = times.dusk;

    if (goldenHourAM > now) {
      events.push({
        type: 'golden_hour',
        title: '🌅 Golden Hour in 15 mins',
        body: `Morning golden light starting at ${goldenHourAM.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        scheduledFor: new Date(goldenHourAM.getTime() - 15 * 60 * 1000),
        metadata: { timeOfDay: 'morning', goldenHourTime: goldenHourAM.toISOString() },
        requiresPro: false,
      });
    }
    if (goldenHourPM > now) {
      events.push({
        type: 'golden_hour',
        title: '🌇 Golden Hour in 15 mins',
        body: `Evening golden light starting at ${goldenHourPM.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        scheduledFor: new Date(goldenHourPM.getTime() - 15 * 60 * 1000),
        metadata: { timeOfDay: 'evening', goldenHourTime: goldenHourPM.toISOString() },
        requiresPro: false,
      });
    }
    if (blueHourPM > now) {
      events.push({
        type: 'blue_hour',
        title: '🌆 Blue Hour tonight',
        body: `Blue hour begins at ${blueHourPM.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        scheduledFor: new Date(blueHourPM.getTime() - 10 * 60 * 1000),
        metadata: { timeOfDay: 'evening', blueHourTime: blueHourPM.toISOString() },
        requiresPro: true,
      });
    }
  }
  return events;
}

async function getWeatherEvents(lat: number, lng: number): Promise<ShootEvent[]> {
  const events: ShootEvent[] = [];
  try {
    const forecast = await getForecast(lat, lng);
    for (const day of forecast) {
      const date = new Date(day.dt * 1000);
      if (date < new Date()) continue;

      if (day.conditionCode >= 700 && day.conditionCode < 800 && day.cloudCover > 70) {
        events.push({
          type: 'fog',
          title: '🌫 Foggy conditions tomorrow',
          body: 'Dramatic fog expected — perfect for moody shots',
          scheduledFor: new Date(date.getTime() - 60 * 60 * 1000),
          metadata: { cloudCover: day.cloudCover, condition: day.condition },
          requiresPro: true,
        });
      }
      if (day.conditionCode >= 600 && day.conditionCode < 700) {
        events.push({
          type: 'snow',
          title: '❄️ Snow day shoot opportunity',
          body: 'Snow forecast — magical winter photography conditions',
          scheduledFor: new Date(date.getTime() - 2 * 60 * 60 * 1000),
          metadata: { condition: day.condition },
          requiresPro: true,
        });
      }
      if (day.cloudCover < 15 && day.conditionCode === 800) {
        const times = SunCalc.getTimes(date, lat, lng);
        events.push({
          type: 'clear_night',
          title: '⭐ Clear night for astrophotography',
          body: 'Zero clouds expected — ideal for Milky Way or stars',
          scheduledFor: new Date(times.night.getTime()),
          metadata: { cloudCover: day.cloudCover },
          requiresPro: true,
        });
      }
    }
  } catch (err) {
    logger.error({ err }, 'Weather events failed');
  }
  return events;
}

export async function scheduleNotificationsForUser(
  userId: string,
  lat: number,
  lng: number,
  tier: string,
): Promise<void> {
  const allEvents = [
    ...getGoldenBlueHourEvents(lat, lng),
    ...(tier === 'PRO' || tier === 'STUDIO' ? await getWeatherEvents(lat, lng) : []),
  ];

  for (const event of allEvents) {
    if (event.requiresPro && tier === 'FREE') continue;
    if (event.scheduledFor < new Date()) continue;

    // Skip if we already have this type scheduled for the same day
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: event.type,
        scheduledFor: {
          gte: new Date(event.scheduledFor.toISOString().slice(0, 10)),
          lt: new Date(new Date(event.scheduledFor).setDate(event.scheduledFor.getDate() + 1)),
        },
      },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: event.type,
        title: event.title,
        body: event.body,
        metadata: JSON.stringify(event.metadata),
        scheduledFor: event.scheduledFor,
      },
    });
  }

  logger.info({ userId, eventCount: allEvents.length }, 'Notifications scheduled');
}
