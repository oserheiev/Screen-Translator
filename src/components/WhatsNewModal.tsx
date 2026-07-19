import React from 'react';
import { useLocale } from '../i18n/useLocale';
import { useAppContext } from '../contexts/AppContext';
import { WhatsNewEntry } from '../whatsnew';

interface WhatsNewModalProps {
  entries: WhatsNewEntry[];
  onClose: () => void;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ entries, onClose }) => {
  const t = useLocale();
  const { appLanguage } = useAppContext();

  if (entries.length === 0) return null;

  const title = t.whatsNewTitle.replace('{version}', entries[0].version);

  return (
    <div className="modal-overlay">
      <div className="modal-content whatsnew-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {entries.map(entry => (
            <div key={entry.version} className="whatsnew-entry">
              {entries.length > 1 && <h3 className="whatsnew-version">v{entry.version}</h3>}
              <ul className="whatsnew-list">
                {entry.bullets.map((bullet, i) => (
                  <li key={i}>{bullet[appLanguage] ?? bullet.English}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" className="save-button" onClick={onClose}>
            {t.whatsNewClose}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
