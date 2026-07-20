# Capture-window locales are merged into the main locale files, not hand-synced separately

The main app (`src/i18n/locales/*.ts`, 12 languages) and the capture overlay window
(`src/capture/captureLocales.ts`, also 12 languages) had two independently maintained
sets of translated strings with no shared source of truth — a new locale or string
added to one was easy to forget in the other, and the two had already drifted. We
considered leaving them separate and only adding a test to catch drift, but rejected
that: it accepts the duplication as permanent and just alarms on it, rather than
removing the reason it can happen.

We picked a single-source-of-truth model instead: capture-window strings are defined
once, inside the main per-language locale files, under a `capture` namespace on
`LocaleStrings`. `src/capture/captureLocales.ts` becomes a thin wrapper —
`getCaptureLocale(lang)` returns `getLocale(lang).capture` — instead of maintaining its
own parallel `Record<string, CaptureLocale>`.

We originally assumed the capture window (a standalone, non-React bundle loaded over a
live screen/game) couldn't afford to pull in the full main-app i18n system, and planned
a build step to extract just the `capture` subset per language. Checking actual file
sizes before implementing showed that assumption was wrong: all 12 main locale files
combined are ~52KB uncompressed (~15KB gzipped) of plain string data with no React or
other heavy dependencies — negligible for a bundle that ships locally with the app
rather than over a network. A plain import (`capture.ts` imports `getLocale` from
`src/i18n`) achieves the same single-source-of-truth goal with no new build tooling.
