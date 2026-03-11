import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '../types';
import { useLocale } from '../i18n/useLocale';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose?: () => void;
  closeOnSelect?: boolean;
}

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

const HistoryPanel: React.FC<HistoryPanelProps> = ({ entries, onSelect, onClear, onClose, closeOnSelect }) => {
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
          <button
            key={entry.id}
            className={`history-item${entry.id === effectiveSelectedId ? ' history-item-active' : ''}`}
            onClick={() => handleSelect(entry)}
            type="button"
          >
            <span className="history-item-text">
              {entry.originalText.trim().slice(0, 40)}{entry.originalText.trim().length > 40 ? '...' : ''}
            </span>
            <span className="history-item-time">{formatTimestamp(entry.timestamp, t.today, t.yesterday)}</span>
          </button>
        ))}
      </div>

      {entries.length > 0 && (
        <div className="history-panel-footer">
          <button className="history-clear-btn" onClick={onClear} type="button">
            {t.clearHistory}
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
