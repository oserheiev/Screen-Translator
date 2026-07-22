# Usage analytics use PostHog (posthog-node, main process only), not Aptabase or posthog-js in the renderer

We considered Aptabase — open source and purpose-built for desktop/mobile apps, with an
Electron SDK that auto-attaches OS and app version to every event — against PostHog, a
larger general-purpose product-analytics platform. We picked PostHog, hosted in its EU
region for data residency, mainly for its much larger free tier (1M events/month) and
mature, well-documented SDKs; the trade-off is that `posthog-node` doesn't auto-detect
the host OS or app version the way Aptabase's SDK does, so a thin wrapper around
`capture()` has to attach those manually on every call.

We also considered using PostHog's browser SDK (`posthog-js`) in the renderer process,
since the renderer is a Chromium context and translations actually complete there.
We rejected this: `posthog-js` is designed to autocapture DOM events, load remote
config, and optionally record sessions — none of which we want, and Electron's CSP
blocks exactly the kind of remote script/config loading it relies on. Instead,
`posthog-node` runs only in the main process, initialized once before
`app.whenReady()`, and the renderer forwards translation-completed events over a new
IPC channel (following this codebase's existing `IPC_CHANNELS` pattern) rather than
calling PostHog directly.
