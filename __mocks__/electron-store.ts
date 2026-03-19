// Mock for electron-store — uses an in-memory Map.
const ElectronStore = jest.fn().mockImplementation(() => {
  const store = new Map<string, any>();
  return {
    get: jest.fn((key: string, defaultValue?: any) => store.get(key) ?? defaultValue),
    set: jest.fn((key: string, value: any) => store.set(key, value)),
    delete: jest.fn((key: string) => store.delete(key)),
    has: jest.fn((key: string) => store.has(key)),
    clear: jest.fn(() => store.clear()),
    store: store,
  };
});

export default ElectronStore;
module.exports = ElectronStore;
