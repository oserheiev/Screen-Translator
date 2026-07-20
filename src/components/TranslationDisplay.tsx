import React, { useState, useEffect } from 'react';
import ClipboardService from '../services/clipboard.service';
import Markdown from 'markdown-to-jsx';
import { useLocale } from '../i18n/useLocale';
import { AlternativeGroup, ContextData } from '../types';

interface TranslationDisplayProps {
  text: string;
  isLoading?: boolean;
  showAlternatives?: boolean;
  showContext?: boolean;
  alternatives?: AlternativeGroup[] | null;
  contextData?: ContextData | null;
  onToggleAlternatives?: () => void;
  onToggleContext?: () => void;
}

const AlternativesIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 13 9 22 9" />
    <polyline points="11 22 11 15 2 15" />
    <line x1="22" y1="2" x2="13" y2="9" />
    <line x1="2" y1="22" x2="11" y2="15" />
  </svg>
);

const ContextIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  text,
  isLoading = false,
  showAlternatives = false,
  showContext = false,
  alternatives = null,
  contextData = null,
  onToggleAlternatives,
  onToggleContext,
}) => {
  const t = useLocale();
  const [isCopied, setIsCopied] = useState(false);
  const [altCollapsed, setAltCollapsed] = useState(false);
  const [ctxCollapsed, setCtxCollapsed] = useState(false);
  const clipboardService = new ClipboardService();

  // Reset collapse state when new data arrives
  useEffect(() => {
    setAltCollapsed(false);
  }, [alternatives]);

  useEffect(() => {
    setCtxCollapsed(false);
  }, [contextData]);

  const handleCopy = async () => {
    if (!text) return;
    const success = await clipboardService.copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const hasAlternatives = showAlternatives && alternatives && alternatives.length > 0;
  const hasContext = showContext && contextData;

  return (
    <div className="translation-panel">
      <div className="panel-header">
        <span className="panel-label">{t.translation}</span>
        <div className="panel-actions">
          {onToggleAlternatives && (
            <button
              className={`toggle-pill${showAlternatives ? ' active' : ''}`}
              onClick={onToggleAlternatives}
              title={t.alternatives}
            >
              <AlternativesIcon />
              <span className="pill-label">{t.altToggleLabel}</span>
            </button>
          )}
          {onToggleContext && (
            <button
              className={`toggle-pill${showContext ? ' active' : ''}`}
              onClick={onToggleContext}
              title={t.contextOfUse}
            >
              <ContextIcon />
              <span className="pill-label">{t.contextToggleLabel}</span>
            </button>
          )}
          <button className="copy-icon-btn-dark" onClick={handleCopy} disabled={!text || isLoading} title={t.copy} aria-label={t.copy}>
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>

      <div className="translation-body">
        <div className="translation-content">
          {text && <Markdown>{text}</Markdown>}
        </div>

        {hasAlternatives && (
          <div className="extras-section">
            <div className="extras-section-header">
              <span className="panel-label">{t.alternatives}</span>
              <button className="collapse-btn" onClick={() => setAltCollapsed(c => !c)}>
                {altCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
              </button>
            </div>
            {!altCollapsed && (
              <div className="alt-groups">
                {alternatives!.map(group => (
                  <div key={group.category} className="alt-group">
                    <div className="alt-category-label">{group.category}</div>
                    <div className="alt-items">
                      {group.items.map(item => (
                        <div key={item.word} className="alt-item">
                          <div className="alt-word">{item.word}</div>
                          <div className="alt-back-translations">{item.backTranslations.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {hasContext && (
          <div className="extras-section">
            <div className="extras-section-header">
              <span className="panel-label">{t.contextOfUse}</span>
              <button className="collapse-btn" onClick={() => setCtxCollapsed(c => !c)}>
                {ctxCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
              </button>
            </div>
            {!ctxCollapsed && (
              <>
                <p className="context-explanation">{contextData!.explanation}</p>
                {contextData!.tags && contextData!.tags.length > 0 && (
                  <div className="context-tags">
                    {contextData!.tags.map(tag => (
                      <span
                        key={tag.label}
                        className={`context-tag${tag.applicable ? '' : ' not-applicable'}`}
                      >
                        {tag.applicable ? <CheckIcon /> : <XIcon />} {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="translation-skeleton-overlay">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          {(showAlternatives || showContext) && (
            <>
              <div className="skeleton-line" style={{ width: '40%', marginTop: '8px' }} />
              <div className="skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton-line" style={{ width: '50%' }} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationDisplay;
