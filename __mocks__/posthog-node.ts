// Mock for posthog-node — avoids real network calls in tests.
export class PostHog {
  constructor(public apiKey: string, public options: any) {}
  capture = jest.fn();
  shutdown = jest.fn().mockResolvedValue(undefined);
}
