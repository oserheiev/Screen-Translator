import privacyPolicyMd from '../docs/legal/privacy-policy.md';
import termsOfUseMd from '../docs/legal/terms-of-use.md';

export const PRIVACY_POLICY = privacyPolicyMd;
export const TERMS_OF_USE = termsOfUseMd;

// A plain djb2 string hash — not cryptographic, just deterministic change
// detection so a Privacy Policy/Terms edit (however small) re-prompts the user.
export function hashLegalDocsContent(privacyPolicy: string, termsOfUse: string): string {
  const combined = `${privacyPolicy} ${termsOfUse}`;
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash + combined.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

export const LEGAL_DOCS_HASH = hashLegalDocsContent(PRIVACY_POLICY, TERMS_OF_USE);
