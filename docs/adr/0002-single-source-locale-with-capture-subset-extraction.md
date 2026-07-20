# Capture-window locales are extracted from the main locale files, not hand-synced separately

The main app (`src/i18n/locales/*.ts`, 12 languages) and the capture overlay window
(`src/capture/captureLocales.ts`, also 12 languages) had two independently maintained
sets of translated strings with no shared source of truth — a new locale or string
added to one was easy to forget in the other, and the two had already drifted. We
considered leaving them separate and only adding a test to catch drift, but rejected
that: it accepts the duplication as permanent and just alarms on it, rather than
removing the reason it can happen.

We picked a single-source-of-truth model instead: capture-window strings are defined
once, inside the main per-language locale files, under a `capture` namespace.
`captureLocales.ts` (or an equivalent build step) extracts just that namespace's keys
per language. This keeps one file per language to edit while preserving the constraint
that motivated the split in the first place — the capture window is a standalone,
non-React bundle that loads over a live screen/game and can't afford to pull in the
full main-app i18n system just for a handful of strings. The trade-off is a small
amount of build/extraction machinery in exchange for eliminating the drift risk at its
source rather than merely detecting it.
