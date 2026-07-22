import React, { useState } from 'react';
import { useLocale } from '../i18n/useLocale';
import { PRIVACY_POLICY, TERMS_OF_USE } from '../legalDocs';
import Modal from './Modal';
import LegalDocumentModal from './LegalDocumentModal';

export type WelcomeModalMode = 'new' | 'update' | 'docs-updated';

interface WelcomeModalProps {
  mode: WelcomeModalMode;
  initialConsent: boolean;
  onComplete: (consent: boolean) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ mode, initialConsent, onComplete }) => {
  const t = useLocale();
  const [consent, setConsent] = useState(initialConsent);
  const [openDoc, setOpenDoc] = useState<'privacy' | 'terms' | null>(null);

  const title = mode === 'new' ? t.welcomeAnalyticsTitle
    : mode === 'update' ? t.analyticsUpdateTitle
    : t.legalDocsUpdatedTitle;
  const intro = mode === 'new' ? t.welcomeAnalyticsIntro
    : mode === 'update' ? t.analyticsUpdateIntro
    : t.legalDocsUpdatedIntro;

  return (
    <>
      <Modal
        title={title}
        onClose={() => onComplete(consent)}
        closeLabel={t.close}
        showCloseButton={false}
        className="welcome-modal"
        footer={
          <button type="button" className="save-button" onClick={() => onComplete(consent)}>
            {t.welcomeModalContinue}
          </button>
        }
      >
        <p className="modal-subtitle">{intro}</p>

        <div className="form-group">
          <div className="form-checkbox-row">
            <input
              id="analytics-consent"
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
            />
            <label htmlFor="analytics-consent">{t.analyticsConsentLabel}</label>
          </div>
          <small className="form-help">{t.analyticsConsentDescription}</small>
        </div>

        <p className="legal-links">
          <button type="button" className="link-button" onClick={() => setOpenDoc('privacy')}>
            {t.privacyPolicyLink}
          </button>
          {' · '}
          <button type="button" className="link-button" onClick={() => setOpenDoc('terms')}>
            {t.termsOfUseLink}
          </button>
        </p>
      </Modal>

      {openDoc === 'privacy' && (
        <LegalDocumentModal title={t.privacyPolicyLink} content={PRIVACY_POLICY} onClose={() => setOpenDoc(null)} />
      )}
      {openDoc === 'terms' && (
        <LegalDocumentModal title={t.termsOfUseLink} content={TERMS_OF_USE} onClose={() => setOpenDoc(null)} />
      )}
    </>
  );
};

export default WelcomeModal;
