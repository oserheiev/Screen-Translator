import { AppLanguage } from './types';
import whatsnewData from './whatsnew.json';

export type WhatsNewNotes = { English: string[] } & Partial<Record<AppLanguage, string[]>>;

export interface WhatsNewEntry {
  version: string;
  notes: WhatsNewNotes;
}

export const WHATS_NEW: WhatsNewEntry[] = whatsnewData as WhatsNewEntry[];

const MAX_ENTRIES_SHOWN = 3;

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getUnseenEntries(
  lastSeen: string | null,
  current: string,
  entries: WhatsNewEntry[] = WHATS_NEW
): WhatsNewEntry[] {
  return entries
    .filter(e =>
      compareVersions(e.version, current) <= 0 &&
      (lastSeen === null || compareVersions(e.version, lastSeen) > 0)
    )
    .sort((a, b) => compareVersions(b.version, a.version))
    .slice(0, MAX_ENTRIES_SHOWN);
}
