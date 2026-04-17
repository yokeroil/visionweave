import axios from 'axios';
import { cacheGet, cacheSet, TTL } from '../../lib/cache';
import { logAPICall } from '../../lib/apiLogger';
import { logger } from '../../lib/logger';

const BASE = 'https://api.openweathermap.org/data/2.5';
const KEY = process.env.OPENWEATHER_API_KEY;

export interface WeatherData {
  condition: string;
  conditionCode: number;
  cloudCover: number;
  humidity: number;
  temp: number;
  windSpeed: number;
  visibility: number;
  description: string;
}

export interface ForecastDay {
  dt: number;
  dateStr: string;
  condition: string;
  conditionCode: number;
  cloudCover: number;
  temp: { min: number; max: number };
  pop: number; // probability of precipitation
}

function locationKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const key = `weather:current:${locationKey(lat, lng)}`;
  const cached = cacheGet<WeatherData>(key);
  if (cached) return cached;

  const start = Date.now();
  try {
    const res = await axios.get(`${BASE}/weather`, {
      params: { lat, lon: lng, appid: KEY, units: 'metric' },
    });
    await logAPICall({ service: 'openweather', endpoint: 'weather', latencyMs: Date.now() - start, statusCode: 200 });

    const d = res.data;
    const data: WeatherData = {
      condition: d.weather[0].main,
      conditionCode: d.weather[0].id,
      cloudCover: d.clouds.all,
      humidity: d.main.humidity,
      temp: d.main.temp,
      windSpeed: d.wind.speed,
      visibility: d.visibility ?? 10000,
      description: d.weather[0].description,
    };
    cacheSet(key, data, TTL.weatherData);
    return data;
  } catch (err) {
    await logAPICall({ service: 'openweather', endpoint: 'weather', latencyMs: Date.now() - start, statusCode: 500 });
    logger.error({ err }, 'Weather fetch failed');
    return { condition: 'Clear', conditionCode: 800, cloudCover: 0, humidity: 50, temp: 20, windSpeed: 5, visibility: 10000, description: 'clear sky' };
  }
}

export async function getForecast(lat: number, lng: number): Promise<ForecastDay[]> {
  const key = `weather:forecast:${locationKey(lat, lng)}`;
  const cached = cacheGet<ForecastDay[]>(key);
  if (cached) return cached;

  const start = Date.now();
  try {
    const res = await axios.get(`${BASE}/forecast`, {
      params: { lat, lon: lng, appid: KEY, units: 'metric', cnt: 40 },
    });
    await logAPICall({ service: 'openweather', endpoint: 'forecast', latencyMs: Date.now() - start, statusCode: 200 });

    // Group by day
    const dayMap = new Map<string, ForecastDay>();
    for (const item of res.data.list) {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().slice(0, 10);
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, {
          dt: item.dt,
          dateStr,
          condition: item.weather[0].main,
          conditionCode: item.weather[0].id,
          cloudCover: item.clouds.all,
          temp: { min: item.main.temp_min, max: item.main.temp_max },
          pop: item.pop ?? 0,
        });
      }
    }

    const days = Array.from(dayMap.values()).slice(0, 7);
    cacheSet(key, days, TTL.weatherData);
    return days;
  } catch (err) {
    await logAPICall({ service: 'openweather', endpoint: 'forecast', latencyMs: Date.now() - start, statusCode: 500 });
    logger.error({ err }, 'Forecast fetch failed');
    return [];
  }
}
