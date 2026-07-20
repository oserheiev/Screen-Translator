import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '../types';
import { useLocale } from '../i18n/useLocale';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose?: () => void;
  closeOnSelect?: boolean;
}

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

function formatTimestamp(ts: number, today: string, yesterday: string): string {
  const date = new Date(ts);
  const now = new Date();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (date.toDateString() === now.toDateString()) return `${today}, ${time}`;
  const prev = new Date(now);
  prev.setDate(now.getDate() - 1);
  if (date.toDateString() === prev.toDateString()) return `${yesterday}, ${time}`;
  return `${date.toLocaleDateString()} ${time}`;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ entries, onSelect, onDelete, onClear, onClose, closeOnSelect }) => {
  const t = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(
    entries.length > 0 ? entries[0].id : null
  );

  // When a new entry is prepended (new translation), select it automatically
  useEffect(() => {
    if (entries.length > 0) {
      setSelectedId(entries[0].id);
    }
  }, [entries[0]?.id]);

  const handleSelect = (entry: HistoryEntry) => {
    setSelectedId(entry.id);
    onSelect(entry);
    if (closeOnSelect) onClose?.();
  };

  const effectiveSelectedId = selectedId ?? (entries[0]?.id ?? null);

  return (
    <div className="history-panel">
      <div className="history-panel-header">
        <div className="history-panel-title-row">
          <span className="history-panel-label">{t.recentHistory}</span>
          {onClose && (
            <button className="history-close-btn" onClick={onClose} type="button">×</button>
          )}
        </div>
        <div className="history-panel-divider" />
      </div>

      <div className="history-panel-list">
        {entries.length === 0 && (
          <div className="history-panel-empty">{t.noHistory}</div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`history-item${entry.id === effectiveSelectedId ? ' history-item-active' : ''}`}
          >
            <button
              className="history-item-main"
              onClick={() => handleSelect(entry)}
              type="button"
            >
              <span className="history-item-text" title={entry.originalText.trim()}>
                {entry.originalText.trim().slice(0, 40)}{entry.originalText.trim().length > 40 ? '...' : ''}
              </span>
              <span className="history-item-langs">
                {(t.languageNames[entry.sourceLanguage] ?? entry.sourceLanguage)}
                {' → '}
                {(t.languageNames[entry.targetLanguage] ?? entry.targetLanguage)}
              </span>
              <span className="history-item-time">{formatTimestamp(entry.timestamp, t.today, t.yesterday)}</span>
            </button>
            <button
              className="history-item-delete-btn"
              onClick={() => onDelete(entry.id)}
              title={t.deleteHistoryEntry}
              aria-label={t.deleteHistoryEntry}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div className="history-panel-footer">
          <button className="history-clear-btn" onClick={onClear} type="button">
            <TrashIcon /> {t.clearHistory}
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
