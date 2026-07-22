import { PRIVACY_POLICY, TERMS_OF_USE, LEGAL_DOCS_HASH, hashLegalDocsContent } from '../legalDocs';

describe('legalDocs', () => {
  it('exposes the bundled document content as non-empty strings', () => {
    expect(typeof PRIVACY_POLICY).toBe('string');
    expect(PRIVACY_POLICY.length).toBeGreaterThan(0);
    expect(typeof TERMS_OF_USE).toBe('string');
    expect(TERMS_OF_USE.length).toBeGreaterThan(0);
  });

  it('computes a stable, non-empty hash from the current bundled content', () => {
    expect(LEGAL_DOCS_HASH).toBe(hashLegalDocsContent(PRIVACY_POLICY, TERMS_OF_USE));
    expect(LEGAL_DOCS_HASH.length).toBeGreaterThan(0);
  });

  it('changes when either document changes', () => {
    const original = hashLegalDocsContent(PRIVACY_POLICY, TERMS_OF_USE);
    const changed = hashLegalDocsContent(PRIVACY_POLICY + ' typo fix', TERMS_OF_USE);
    expect(changed).not.toBe(original);
  });

  it('is deterministic for the same content', () => {
    const a = hashLegalDocsContent('same', 'content');
    const b = hashLegalDocsContent('same', 'content');
    expect(a).toBe(b);
  });
});
