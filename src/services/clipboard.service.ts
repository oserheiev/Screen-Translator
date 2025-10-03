export class ClipboardService {
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (window.electron) {
        // Use Electron's clipboard API
        await window.electron.clipboard.writeText(text);
      } else {
        // Fallback to browser clipboard API
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      return false;
    }
  }
}

export default ClipboardService;