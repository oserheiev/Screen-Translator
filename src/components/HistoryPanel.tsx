import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString()} ${time}`;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ entries, onSelect, onClear }) => {
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
  };

  const effectiveSelectedId = selectedId ?? (entries[0]?.id ?? null);

  return (
    <div className="history-panel">
      <div className="history-panel-header">
        <span className="history-panel-label">Recent History</span>
        <div className="history-panel-divider" />
      </div>

      <div className="history-panel-list">
        {entries.length === 0 && (
          <div className="history-panel-empty">No history yet</div>
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
            <span className="history-item-time">{formatTimestamp(entry.timestamp)}</span>
          </button>
        ))}
      </div>

      {entries.length > 0 && (
        <div className="history-panel-footer">
          <button className="history-clear-btn" onClick={onClear} type="button">
            🗑 Clear All History
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
