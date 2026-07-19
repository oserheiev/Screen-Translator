---
name: release-notes
description: Write a release-note fragment for a PR's user-facing change, or mark the PR as needing none. Use when finishing a development branch, before opening the PR.
---

# Release Notes

This repo ships user-facing release notes compiled from small per-PR fragments — see
`CONTEXT.md` for the glossary (**note fragment**, **release note entry**, **release
note bullet**) and `docs/adr/0001-release-notes-authored-per-pr.md` for why.

## When this runs

Invoke this as part of finishing a development branch, before opening the PR (per the
CLAUDE.md rule pointing here). You have the full diff of the branch in context — use it.

## Step 1: Judge whether the change is user-facing

Ask: would someone using Screen Translator notice or care about this, described in
plain language? Yes for: new features, bug fixes, UI/UX changes, noticeable performance
changes. No for: refactors, internal tooling, CI/workflow changes, test-only changes,
dependency bumps with no behavior change, documentation.

## Step 2a: User-facing — write the fragment

Create `.release-notes/<slug>.yml`, where `<slug>` is a short kebab-case name for the
change (e.g. matching the branch name). Format — a YAML list, one item per bullet:

```yaml
- English: Faster capture overlay startup
  Russian: Более быстрый запуск оверлея захвата
  Ukrainian: Швидший запуск оверлею захоплення
- English: Fixed capture flicker on multi-display setups
```

Rules:
- `English` is mandatory on every bullet and must be non-empty.
- Write 1-3 bullets per PR — one per distinct user-facing change, not one per commit.
- Word each bullet as you would a changelog line for an end user, not a commit message
  (say what changed for them, not how the code changed).
- Also provide `Russian` and `Ukrainian` translations for each bullet yourself — you are
  the translator here, there is no separate translation step. Skip a language only if
  I've asked to skip.
- Do not add any other language keys unless explicitly asked — only `English`,
  `Russian`, `Ukrainian` are translated in this repo today.

## Step 2b: Not user-facing — label instead

If the change has no user-facing impact, do not create a fragment. Instead, apply the
`no-release-notes` label to the PR: `gh pr create --label no-release-notes ...` if
you're creating the PR in the same step, or `gh pr edit <number> --add-label
no-release-notes` if it already exists. A CI check enforces that every PR touching
`src/` or `electron/` has either a fragment or this label.

## What not to do

- Never edit `src/whatsnew.json` directly — it's compiled from fragments at release
  time by `scripts/compile-release-notes.mjs`.
- Never call an external translation API — translations are written by you, inline, as
  part of this same step.
