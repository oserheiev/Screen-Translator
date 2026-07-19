import React from 'react';
import { useLocale } from '../i18n/useLocale';
import { useAppContext } from '../contexts/AppContext';
import { WhatsNewBullet } from '../whatsnew';

interface UpdateAvailableModalProps {
  version: string;
  previewBullets: WhatsNewBullet[] | null;
  onUpdate: () => void;
  onIgnore: () => void;
  onClose: () => void;
}

const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({ version, previewBullets, onUpdate, onIgnore, onClose }) => {
  const t = useLocale();
  const { appLanguage } = useAppContext();

  return (
    <div className="modal-overlay">
      <div className="modal-content update-available-modal">
        <div className="modal-header">
          <h2>{t.updateAvailableTitle}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">{t.updateAvailableMessage.replace('{version}', version)}</p>
          {previewBullets && previewBullets.length > 0 && (
            <ul className="whatsnew-list">
              {previewBullets.map((bullet, i) => (
                <li key={i}>{bullet[appLanguage] ?? bullet.English}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="cancel-button" onClick={onIgnore}>
            {t.ignoreRelease}
          </button>
          <button type="button" className="save-button" onClick={onUpdate}>
            {t.updateNow}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateAvailableModal;
