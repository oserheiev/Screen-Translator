import React from 'react';
import { useLocale } from '../i18n/useLocale';

interface PermissionModalProps {
  platform: string;
  onOpenSettings: () => void;
  onClose: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ platform, onOpenSettings, onClose }) => {
  const t = useLocale();
  const isMac = platform === 'darwin';
  const isWindows = platform === 'win32';

  return (
    <div className="modal-overlay">
      <div className="modal-content permission-modal">
        <div className="modal-header">
          <h2>{t.permissionTitle}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <p className="modal-subtitle">{t.permissionDescription}</p>

        {isMac && (
          <ol className="permission-steps">
            <li>{t.permissionMacStep1}</li>
            <li>{t.permissionMacStep2}</li>
            <li>{t.permissionMacStep3}</li>
            <li>{t.permissionMacStep4}</li>
          </ol>
        )}

        {isWindows && (
          <ol className="permission-steps">
            <li>{t.permissionWinStep1}</li>
            <li>{t.permissionWinStep2}</li>
            <li>{t.permissionWinStep3}</li>
          </ol>
        )}

        {!isMac && !isWindows && (
          <p className="permission-steps">{t.permissionGeneric}</p>
        )}

        <div className="modal-footer">
          <button type="button" className="cancel-button" onClick={onClose}>
            {t.close}
          </button>
          {(isMac || isWindows) && (
            <button type="button" className="save-button" onClick={onOpenSettings}>
              {t.openSettings}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
