import Anthropic from '@anthropic-ai/sdk';
import { logAPICall } from '../../lib/apiLogger';
import { logger } from '../../lib/logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface StyleVector {
  golden_hour: number;
  blue_hour: number;
  portrait: number;
  landscape: number;
  street: number;
  architecture: number;
  astro: number;
  moody: number;
  bright_airy: number;
  film_grain: number;
  minimal: number;
  warm_tones: number;
  cool_tones: number;
  vibrant: number;
}

export const DEFAULT_VECTOR: StyleVector = {
  golden_hour: 0.5, blue_hour: 0.5, portrait: 0.5, landscape: 0.5,
  street: 0.3, architecture: 0.3, astro: 0.2, moody: 0.4,
  bright_airy: 0.4, film_grain: 0.3, minimal: 0.4,
  warm_tones: 0.5, cool_tones: 0.4, vibrant: 0.4,
};

interface QuizPhoto {
  photoId: string;
  tags: string[];
  selected: boolean;
}

export async function inferStyleProfile(
  genres: string[],
  moods: string[],
  quizPhotos: QuizPhoto[],
): Promise<{ vector: StyleVector; summary: string }> {
  const selected = quizPhotos.filter((p) => p.selected);
  const rejected = quizPhotos.filter((p) => !p.selected);

  const prompt = `You are a photography style analyst. Analyze these preferences and return a style profile.

User's stated preferences:
- Genres: ${genres.join(', ')}
- Moods/Aesthetics: ${moods.join(', ')}

Selected photos (loved these):
${selected.map((p) => `  Tags: [${p.tags.join(', ')}]`).join('\n')}

Rejected/skipped photos (didn't resonate):
${rejected.slice(0, 10).map((p) => `  Tags: [${p.tags.join(', ')}]`).join('\n')}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "vector": {
    "golden_hour": 0.0-1.0,
    "blue_hour": 0.0-1.0,
    "portrait": 0.0-1.0,
    "landscape": 0.0-1.0,
    "street": 0.0-1.0,
    "architecture": 0.0-1.0,
    "astro": 0.0-1.0,
    "moody": 0.0-1.0,
    "bright_airy": 0.0-1.0,
    "film_grain": 0.0-1.0,
    "minimal": 0.0-1.0,
    "warm_tones": 0.0-1.0,
    "cool_tones": 0.0-1.0,
    "vibrant": 0.0-1.0
  },
  "summary": "one sentence describing this photographer's style (max 12 words)"
}`;

  const start = Date.now();
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Date.now() - start;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    await logAPICall({
      service: 'anthropic',
      endpoint: 'messages',
      latencyMs,
      statusCode: 200,
      tokensUsed: inputTokens,
      outputTokens,
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const parsed = JSON.parse(content.text);
    logger.info({ summary: parsed.summary }, 'Style inference complete');
    return { vector: parsed.vector, summary: parsed.summary };
  } catch (err) {
    const latencyMs = Date.now() - start;
    await logAPICall({ service: 'anthropic', endpoint: 'messages', latencyMs, statusCode: 500 });
    logger.error({ err }, 'Style inference failed, using defaults');
    return {
      vector: DEFAULT_VECTOR,
      summary: 'Versatile photographer exploring diverse styles',
    };
  }
}
