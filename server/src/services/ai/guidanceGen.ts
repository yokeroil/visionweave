import Anthropic from '@anthropic-ai/sdk';
import { cacheGet, cacheSet, TTL } from '../../lib/cache';
import { logAPICall } from '../../lib/apiLogger';
import { logger } from '../../lib/logger';
import { StyleVector } from './styleInference';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface SceneContext {
  sceneLabel: string;
  sunAzimuth: number;
  sunAltitude: number;
  isGoldenHour: boolean;
  isBlueHour: boolean;
  weatherCondition?: string;
}

export interface GuidanceResult {
  compositionTip: string;
  sceneLabel: string;
  lightQuality: 'optimal' | 'good' | 'flat' | 'harsh' | 'low';
  sunAzimuth: number;
  sunAltitude: number;
  isGoldenHour: boolean;
  isBlueHour: boolean;
  styleMatchScore: number;
  cachedAt?: string;
}

function getLightQuality(scene: SceneContext): 'optimal' | 'good' | 'flat' | 'harsh' | 'low' {
  if (scene.isGoldenHour || scene.isBlueHour) return 'optimal';
  if (scene.sunAltitude < 0) return 'low';
  if (scene.sunAltitude < 10) return 'good';
  if (scene.sunAltitude > 60) return 'harsh';
  const cond = scene.weatherCondition?.toLowerCase() ?? '';
  if (cond.includes('overcast') || cond.includes('cloud')) return 'flat';
  return 'good';
}

function buildCacheKey(scene: SceneContext, topTag: string): string {
  const quadrant = Math.floor(scene.sunAzimuth / 45);
  const altBucket = scene.isGoldenHour ? 'golden' : scene.isBlueHour ? 'blue' : scene.sceneLabel;
  return `guidance:${altBucket}:q${quadrant}:${topTag}`;
}

function getTopTag(vector: StyleVector): string {
  return Object.entries(vector).sort(([, a], [, b]) => b - a)[0][0];
}

export async function generateGuidance(
  scene: SceneContext,
  styleVector: StyleVector,
): Promise<GuidanceResult> {
  const topTag = getTopTag(styleVector);
  const cacheKey = buildCacheKey(scene, topTag);

  const cached = cacheGet<GuidanceResult>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'Guidance cache hit');
    return { ...cached, cachedAt: new Date().toISOString() };
  }

  const topStyle = Object.entries(styleVector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${k}:${v.toFixed(2)}`)
    .join(', ');

  const sunDir = `${scene.sunAzimuth.toFixed(0)}° azimuth, ${scene.sunAltitude.toFixed(0)}° altitude`;
  const prompt = `You are a photography composition coach. Give a single actionable tip.

Scene: ${scene.sceneLabel}. Sun at ${sunDir}. ${scene.weatherCondition ?? 'Clear sky'}.
Photographer's top style tags: ${topStyle}

Return ONLY valid JSON (no markdown):
{
  "tip": "max 15 words, specific and actionable composition advice",
  "styleMatchScore": 0.0-1.0
}`;

  const start = Date.now();
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Date.now() - start;
    await logAPICall({
      service: 'anthropic',
      endpoint: 'messages',
      latencyMs,
      statusCode: 200,
      tokensUsed: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Bad response');
    const parsed = JSON.parse(content.text);

    const result: GuidanceResult = {
      compositionTip: parsed.tip,
      sceneLabel: scene.sceneLabel,
      lightQuality: getLightQuality(scene),
      sunAzimuth: scene.sunAzimuth,
      sunAltitude: scene.sunAltitude,
      isGoldenHour: scene.isGoldenHour,
      isBlueHour: scene.isBlueHour,
      styleMatchScore: parsed.styleMatchScore,
    };

    cacheSet(cacheKey, result, TTL.guidance);
    return result;
  } catch (err) {
    const latencyMs = Date.now() - start;
    await logAPICall({ service: 'anthropic', endpoint: 'messages', latencyMs, statusCode: 500 });
    logger.error({ err }, 'Guidance generation failed');

    const fallback: GuidanceResult = {
      compositionTip: `Place your main subject at the left intersection point`,
      sceneLabel: scene.sceneLabel,
      lightQuality: getLightQuality(scene),
      sunAzimuth: scene.sunAzimuth,
      sunAltitude: scene.sunAltitude,
      isGoldenHour: scene.isGoldenHour,
      isBlueHour: scene.isBlueHour,
      styleMatchScore: 0.5,
    };
    cacheSet(cacheKey, fallback, 60);
    return fallback;
  }
}
