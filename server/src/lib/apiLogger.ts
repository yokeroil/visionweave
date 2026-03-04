import { prisma } from './prisma';

const COST_PER_UNIT: Record<string, number> = {
  anthropic_input: 3.0 / 1_000_000,
  anthropic_output: 15.0 / 1_000_000,
  openweather: 0.00015,
  google_places: 0.0017,
  unsplash: 0,
};

export async function logAPICall(params: {
  service: string;
  endpoint: string;
  latencyMs: number;
  statusCode: number;
  tokensUsed?: number;
  outputTokens?: number;
}) {
  let costEstimate = 0;
  if (params.service === 'anthropic' && params.tokensUsed) {
    costEstimate =
      params.tokensUsed * COST_PER_UNIT.anthropic_input +
      (params.outputTokens ?? 0) * COST_PER_UNIT.anthropic_output;
  } else if (COST_PER_UNIT[params.service] !== undefined) {
    costEstimate = COST_PER_UNIT[params.service];
  }

  await prisma.aPICallLog.create({
    data: {
      service: params.service,
      endpoint: params.endpoint,
      latencyMs: params.latencyMs,
      statusCode: params.statusCode,
      tokensUsed: params.tokensUsed,
      costEstimate,
    },
  });
}
