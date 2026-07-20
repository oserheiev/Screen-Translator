import React from 'react';
import { useLocale } from '../i18n/useLocale';
import { useAppContext } from '../contexts/AppContext';
import { WhatsNewBullet } from '../whatsnew';
import Modal from './Modal';

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
    <Modal
      title={t.updateAvailableTitle}
      onClose={onClose}
      closeLabel={t.close}
      className="update-available-modal"
      footer={
        <>
          <button type="button" className="cancel-button" onClick={onIgnore}>
            {t.ignoreRelease}
          </button>
          <button type="button" className="save-button" onClick={onUpdate}>
            {t.updateNow}
          </button>
        </>
      }
    >
      <p className="modal-subtitle">{t.updateAvailableMessage.replace('{version}', version)}</p>
      {previewBullets && previewBullets.length > 0 && (
        <ul className="whatsnew-list">
          {previewBullets.map((bullet, i) => (
            <li key={i}>{bullet[appLanguage] ?? bullet.English}</li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default UpdateAvailableModal;
