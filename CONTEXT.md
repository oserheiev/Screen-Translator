# Context: Screen Translator

## Glossary

### Note fragment
A small file added by a PR to describe one or more user-facing changes,
living under `.release-notes/` (one file per PR/feature, e.g.
`.release-notes/faster-capture-overlay.yml`). Deliberately one file per PR — never
a shared running list — so concurrent PRs never merge-conflict with each
other. Contains a list of bullets; each bullet has a mandatory English
string and optional translations. Written during the PR itself (by a
project skill invoked when finishing a branch), not reconstructed from
commit history or drafted by AI at release time. Consumed and removed when
compiled into a **release note entry** at release time.

### Release note entry
The compiled, per-version list of bullets shown to users — after an update,
in the "What's New" modal, or (as a preview) before an update, in the
Update Available modal. Stored in `src/whatsnew.json`, keyed by version.
Built by a purely mechanical compile step that concatenates all **note
fragments** present at release time — no AI call, no network access, no
translation step at release time (translations, where present, already
live in the fragments).

### Release note bullet
A single user-facing line within a release note entry. The bullet, not the
entry, is the unit of translation: it carries a mandatory English string
plus any number of optional per-language translations. This lets one
release mix fully-translated and English-only bullets — the app falls back
to English per bullet, not per whole entry.

### Translation event
The unit counted toward "translations per day" in usage analytics: one
successful translation the user obtained, whether from a fresh screen
capture or from re-translating already-captured text. A retry behind the
scenes still counts as a single translation once it succeeds; viewing
alternates or context for an existing result is not a new translation.
_Avoid_: translation attempt, API call

### Consent decision
Whether the user currently allows anonymous usage analytics to be shared,
defaulting to allowed until the user turns it off. A change to the Privacy
Policy or Terms of Use re-notifies the user but never silently resets this
choice.
_Avoid_: opt-in status, tracking permission

### Legal docs acknowledgement
That the user has been shown the currently-in-effect Privacy Policy and
Terms of Use. Tracked by comparing a content fingerprint of the current
docs against the fingerprint last shown — any wording change, however
small, is treated as new docs requiring a fresh acknowledgement.
_Avoid_: docs version, accepted version
