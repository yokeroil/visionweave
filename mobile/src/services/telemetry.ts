import { api } from './api';

const queue: Array<{ eventType: string; properties: Record<string, unknown>; latencyMs?: number }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function track(eventType: string, properties: Record<string, unknown> = {}, latencyMs?: number) {
  queue.push({ eventType, properties, latencyMs });
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 3000);
  }
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue.splice(0, 50);
  try {
    await api.post('/telemetry/events', { events: batch });
  } catch {
    // Silently discard telemetry failures — never block user
  }
}
