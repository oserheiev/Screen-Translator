import React, { useId, useRef } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface ModalProps {
  title: string;
  onClose: () => void;
  closeLabel: string;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  title,
  onClose,
  closeLabel,
  showCloseButton = true,
  footer,
  className,
  children,
}) => {
  const titleId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  useDialogA11y(contentRef, onClose);

  return (
    <div className="modal-overlay">
      <div
        ref={contentRef}
        className={`modal-content${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          {showCloseButton && (
            <button className="close-button" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
              ×
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
