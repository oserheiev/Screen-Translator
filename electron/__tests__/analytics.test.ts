import {
  getOrCreateDistinctId,
  createAnalyticsClient,
  buildTranslationEventProperties,
  trackAppStarted,
  trackTranslationCompleted,
} from '../analytics';
import { ANALYTICS_CONFIG } from '../constants';

describe('getOrCreateDistinctId', () => {
  it('returns the existing distinctId when one is already stored', () => {
    const store = { get: jest.fn().mockReturnValue('existing-id'), set: jest.fn() };
    const result = getOrCreateDistinctId(store, () => 'new-id');
    expect(result).toBe('existing-id');
    expect(store.set).not.toHaveBeenCalled();
  });

  it('generates and persists a new id when none is stored', () => {
    const store = { get: jest.fn().mockReturnValue(undefined), set: jest.fn() };
    const result = getOrCreateDistinctId(store, () => 'new-id');
    expect(result).toBe('new-id');
    expect(store.set).toHaveBeenCalledWith('distinctId', 'new-id');
  });
});

describe('createAnalyticsClient', () => {
  it('constructs a PostHog client with the configured key and EU host', () => {
    const client = createAnalyticsClient() as any;
    expect(client.apiKey).toBe(ANALYTICS_CONFIG.PROJECT_API_KEY);
    expect(client.options.host).toBe(ANALYTICS_CONFIG.HOST);
  });
});

describe('buildTranslationEventProperties', () => {
  it('attaches os, appVersion, languagePair, and trigger', () => {
    const props = buildTranslationEventProperties(
      { languagePair: 'Auto -> English', trigger: 'capture' },
      '1.11.0',
      'win32'
    );
    expect(props).toEqual({
      languagePair: 'Auto -> English',
      trigger: 'capture',
      os: 'win32',
      appVersion: '1.11.0',
    });
  });
});

describe('trackAppStarted', () => {
  it('sends the event when analytics is enabled', () => {
    const client = { capture: jest.fn() };
    trackAppStarted(client as any, 'device-1', true);
    expect(client.capture).toHaveBeenCalledWith({ distinctId: 'device-1', event: 'app_started' });
  });

  it('does not send when disabled', () => {
    const client = { capture: jest.fn() };
    trackAppStarted(client as any, 'device-1', false);
    expect(client.capture).not.toHaveBeenCalled();
  });

  it('does not send when consent has not been decided yet (undefined)', () => {
    const client = { capture: jest.fn() };
    trackAppStarted(client as any, 'device-1', undefined);
    expect(client.capture).not.toHaveBeenCalled();
  });
});

describe('trackTranslationCompleted', () => {
  it('sends the event with properties when enabled', () => {
    const client = { capture: jest.fn() };
    const properties = { languagePair: 'Auto -> English', trigger: 'manual', os: 'win32', appVersion: '1.11.0' };
    trackTranslationCompleted(client as any, 'device-1', true, properties);
    expect(client.capture).toHaveBeenCalledWith({
      distinctId: 'device-1',
      event: 'translation_completed',
      properties,
    });
  });

  it('does not send when disabled', () => {
    const client = { capture: jest.fn() };
    trackTranslationCompleted(client as any, 'device-1', false, { languagePair: 'x', trigger: 'capture', os: 'win32', appVersion: '1.0.0' });
    expect(client.capture).not.toHaveBeenCalled();
  });

  it('does not send when consent has not been decided yet (undefined)', () => {
    const client = { capture: jest.fn() };
    trackTranslationCompleted(client as any, 'device-1', undefined, { languagePair: 'x', trigger: 'capture', os: 'win32', appVersion: '1.0.0' });
    expect(client.capture).not.toHaveBeenCalled();
  });
});
