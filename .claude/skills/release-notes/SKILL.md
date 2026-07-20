---
name: release-notes
description: Write a release-note fragment for a PR's user-facing change, or mark the PR as needing none. Use when finishing a development branch, before opening the PR.
---

# Release Notes

Release notes are compiled from small per-PR fragments — see `CONTEXT.md` for the
glossary and `docs/adr/0001-release-notes-authored-per-pr.md` for why.

Invoke this when finishing a branch, before opening the PR.

## Step 1: Is it user-facing?

Yes: new features, bug fixes, UI/UX changes, noticeable performance changes.
No: refactors, internal tooling, CI/workflow changes, test-only changes, dependency
bumps with no behavior change, documentation.

## Step 2a: User-facing — write the fragment

Create `.release-notes/<slug>.yml` (kebab-case, e.g. matching the branch name):

```yaml
- English: "Faster capture overlay startup"
  Russian: "Более быстрый запуск оверлея захвата"
  Ukrainian: "Швидший запуск оверлею захоплення"
- English: "Fixed capture flicker on multi-display setups"
```

Rules:
- `English` is mandatory and non-empty.
- Always double-quote every value, even when it looks safe unquoted — an unquoted
  scalar containing `: ` (colon-space) gets misparsed as a nested mapping and crashes
  `compile-release-notes.mjs` at release time. Translations with a "Fixed:"-style
  lead-in (`Исправлено: ...`, `Виправлено: ...`) hit this every time.
- 1-3 bullets per PR, one per distinct user-facing change, not per commit.
- Word bullets as an end-user changelog line, not a commit message.
- Translate `Russian` and `Ukrainian` yourself, inline — no external translation API,
  no separate step. Skip a language only if asked. Don't add other language keys.

## Step 2b: Not user-facing — label instead

Apply the `no-release-notes` label instead of writing a fragment: `gh pr create
--label no-release-notes ...` or `gh pr edit <number> --add-label no-release-notes`. CI
enforces one or the other on PRs touching `src/` or `electron/`.

## What not to do

- Never edit `src/whatsnew.json` directly — it's compiled from fragments at release time.
