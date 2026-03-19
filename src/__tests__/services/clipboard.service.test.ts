import { ClipboardService } from '../../services/clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;

  beforeEach(() => {
    service = new ClipboardService();
    jest.clearAllMocks();
  });

  it('uses window.electron.clipboard.writeText when Electron is available', async () => {
    const result = await service.copyToClipboard('Hello');

    expect(window.electron.clipboard.writeText).toHaveBeenCalledWith('Hello');
    expect(result).toBe(true);
  });

  it('falls back to navigator.clipboard when Electron is not available', async () => {
    const original = (window as any).electron;
    (window as any).electron = undefined;

    const mockWrite = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWrite },
      writable: true,
      configurable: true,
    });

    const result = await service.copyToClipboard('Hello');

    expect(mockWrite).toHaveBeenCalledWith('Hello');
    expect(result).toBe(true);

    (window as any).electron = original;
  });

  it('returns false when electron clipboard throws', async () => {
    (window.electron.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

    const result = await service.copyToClipboard('Hello');

    expect(result).toBe(false);
  });

  it('returns false when navigator.clipboard throws', async () => {
    const original = (window as any).electron;
    (window as any).electron = undefined;

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockRejectedValue(new Error('Permission denied')) },
      writable: true,
      configurable: true,
    });

    const result = await service.copyToClipboard('Hello');

    expect(result).toBe(false);

    (window as any).electron = original;
  });
});
