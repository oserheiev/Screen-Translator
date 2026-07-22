import React from 'react';
import Markdown from 'markdown-to-jsx';
import { useLocale } from '../i18n/useLocale';
import Modal from './Modal';

interface LegalDocumentModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({ title, content, onClose }) => {
  const t = useLocale();

  return (
    <Modal title={title} onClose={onClose} closeLabel={t.close} className="legal-document-modal">
      <Markdown>{content}</Markdown>
    </Modal>
  );
};

export default LegalDocumentModal;
