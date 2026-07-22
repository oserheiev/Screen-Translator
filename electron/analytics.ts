import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
import { ANALYTICS_CONFIG } from './constants';

export interface DistinctIdStore {
  get: (key: 'distinctId') => string | undefined;
  set: (key: 'distinctId', value: string) => void;
}

export function getOrCreateDistinctId(store: DistinctIdStore, generateId: () => string = randomUUID): string {
  const existing = store.get('distinctId');
  if (existing) return existing;
  const id = generateId();
  store.set('distinctId', id);
  return id;
}

export function createAnalyticsClient(): PostHog {
  return new PostHog(ANALYTICS_CONFIG.PROJECT_API_KEY, {
    host: ANALYTICS_CONFIG.HOST,
    // Low-volume desktop app (at most a couple of events per launch) — flush
    // immediately rather than batching, since the process may quit anytime.
    flushAt: 1,
    flushInterval: 0,
  });
}

export interface TranslationEventInput {
  languagePair: string;
  trigger: 'capture' | 'manual';
}

export function buildTranslationEventProperties(
  input: TranslationEventInput,
  appVersion: string,
  platform: string = process.platform
): Record<string, string> {
  return {
    languagePair: input.languagePair,
    trigger: input.trigger,
    os: platform,
    appVersion,
  };
}

type CaptureClient = Pick<PostHog, 'capture'>;

export function trackAppStarted(client: CaptureClient, distinctId: string, enabled: boolean | undefined): void {
  if (!enabled) return;
  client.capture({ distinctId, event: 'app_started' });
}

export function trackTranslationCompleted(
  client: CaptureClient,
  distinctId: string,
  enabled: boolean | undefined,
  properties: Record<string, string>
): void {
  if (!enabled) return;
  client.capture({ distinctId, event: 'translation_completed', properties });
}
