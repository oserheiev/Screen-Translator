// Manual mock for @google/genai — replaces the ESM package in all Jest tests.
// Individual tests configure the mock behaviour via mockImplementation in beforeEach.

export const GoogleGenAI = jest.fn();

// GenerateContentResponse is used as a type-only import in gemini.service.ts,
// but ts-jest needs something exported here to satisfy the import.
export class GenerateContentResponse {
  text?: string;
}
