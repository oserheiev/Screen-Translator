import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

describe('useDialogA11y', () => {
  it('calls onClose when Escape is pressed for a single mounted modal', () => {
    const containerRef = createRef<HTMLDivElement>();
    const onClose = jest.fn();
    renderHook(() => useDialogA11y(containerRef, onClose));

    pressEscape();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('only calls the topmost (most-recently-mounted) modal onClose when nested', () => {
    const outerRef = createRef<HTMLDivElement>();
    const outerOnClose = jest.fn();
    renderHook(() => useDialogA11y(outerRef, outerOnClose));

    const innerRef = createRef<HTMLDivElement>();
    const innerOnClose = jest.fn();
    renderHook(() => useDialogA11y(innerRef, innerOnClose));

    pressEscape();

    expect(innerOnClose).toHaveBeenCalledTimes(1);
    expect(outerOnClose).not.toHaveBeenCalled();
  });

  it('falls back to the next-topmost modal once the topmost one unmounts', () => {
    const outerRef = createRef<HTMLDivElement>();
    const outerOnClose = jest.fn();
    renderHook(() => useDialogA11y(outerRef, outerOnClose));

    const innerRef = createRef<HTMLDivElement>();
    const innerOnClose = jest.fn();
    const inner = renderHook(() => useDialogA11y(innerRef, innerOnClose));

    inner.unmount();

    pressEscape();

    expect(outerOnClose).toHaveBeenCalledTimes(1);
    expect(innerOnClose).not.toHaveBeenCalled();
  });
});
