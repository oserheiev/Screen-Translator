import React from 'react';

interface PermissionModalProps {
  platform: string;
  onOpenSettings: () => void;
  onClose: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ platform, onOpenSettings, onClose }) => {
  const isMac = platform === 'darwin';
  const isWindows = platform === 'win32';

  return (
    <div className="modal-overlay">
      <div className="modal-content permission-modal">
        <div className="modal-header">
          <h2>Screen Recording Permission</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <p className="modal-subtitle">
          Screen Translator needs permission to record your screen in order to capture text.
        </p>

        {isMac && (
          <ol className="permission-steps">
            <li>Click <strong>Open Settings</strong> below</li>
            <li>Find <strong>Screen Translator</strong> in the list</li>
            <li>Enable the toggle next to it</li>
            <li>Restart the app</li>
          </ol>
        )}

        {isWindows && (
          <ol className="permission-steps">
            <li>Click <strong>Open Settings</strong> below</li>
            <li>Enable <strong>Screen recording</strong> for this app</li>
            <li>Restart the app</li>
          </ol>
        )}

        {!isMac && !isWindows && (
          <p className="permission-steps">
            Please grant screen recording permission in your system settings, then restart the app.
          </p>
        )}

        <div className="modal-footer">
          <button type="button" className="cancel-button" onClick={onClose}>
            Close
          </button>
          {(isMac || isWindows) && (
            <button type="button" className="save-button" onClick={onOpenSettings}>
              Open Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
