import { compareVersions, getUnseenEntries, WHATS_NEW, WhatsNewEntry } from '../whatsnew';
import { APP_LANGUAGES } from '../i18n';

describe('compareVersions', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.6.0', '1.7.0', -1],
    ['1.7.0', '1.6.0', 1],
    ['1.10.0', '1.9.0', 1],
    ['1.7', '1.7.0', 0],
    ['2.0.0', '1.9.9', 1],
  ])('compareVersions(%s, %s) has sign %i', (a, b, expected) => {
    expect(Math.sign(compareVersions(a as string, b as string))).toBe(expected);
  });
});

const entries: WhatsNewEntry[] = [
  { version: '2.0.0', bullets: [{ English: 'two zero' }] },
  { version: '1.9.0', bullets: [{ English: 'one nine' }] },
  { version: '1.8.0', bullets: [{ English: 'one eight' }] },
  { version: '1.7.0', bullets: [{ English: 'one seven' }] },
];

describe('getUnseenEntries', () => {
  it('returns entries strictly after lastSeen up to and including current, newest first', () => {
    expect(getUnseenEntries('1.7.0', '1.9.0', entries).map(e => e.version)).toEqual(['1.9.0', '1.8.0']);
  });

  it('excludes entries newer than the current version', () => {
    expect(getUnseenEntries('1.8.0', '1.9.0', entries).map(e => e.version)).toEqual(['1.9.0']);
  });

  it('treats null lastSeen as everything unseen, capped at 3 entries', () => {
    expect(getUnseenEntries(null, '2.0.0', entries).map(e => e.version)).toEqual(['2.0.0', '1.9.0', '1.8.0']);
  });

  it('returns empty when up to date', () => {
    expect(getUnseenEntries('2.0.0', '2.0.0', entries)).toEqual([]);
  });

  it('returns empty when no entries exist in the range', () => {
    expect(getUnseenEntries('2.0.0', '2.1.0', entries)).toEqual([]);
  });
});

describe('whatsnew.json schema', () => {
  it('has valid, unique, newest-first entries with a mandatory English bullet each', () => {
    const versions = WHATS_NEW.map(e => e.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (let i = 1; i < WHATS_NEW.length; i++) {
      expect(compareVersions(WHATS_NEW[i - 1].version, WHATS_NEW[i].version)).toBeGreaterThan(0);
    }
    for (const entry of WHATS_NEW) {
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.bullets.length).toBeGreaterThan(0);
      for (const bullet of entry.bullets) {
        expect(typeof bullet.English).toBe('string');
        expect(bullet.English.trim()).not.toBe('');
        for (const [lang, text] of Object.entries(bullet)) {
          expect(APP_LANGUAGES).toContain(lang);
          expect(typeof text).toBe('string');
          expect((text as string).trim()).not.toBe('');
        }
      }
    }
  });
});
