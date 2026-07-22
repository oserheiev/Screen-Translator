import { useEffect, useId, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Module-level stack of active dialog instance IDs, most-recently-mounted last.
// When dialogs are nested (a modal opened from within another modal), only the
// topmost one should react to Escape - otherwise a single Escape press would
// close every mounted dialog at once.
const modalStack: string[] = [];

export function useDialogA11y(containerRef: RefObject<HTMLElement>, onClose: () => void): void {
  const id = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    modalStack.push(id);

    return () => {
      previouslyFocused?.focus();
      const index = modalStack.indexOf(id);
      if (index !== -1) modalStack.splice(index, 1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalStack[modalStack.length - 1] === id) {
          onClose();
        }
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, containerRef, id]);
}
