# Privacy Policy

_Last updated: 2026-07-22_

Screen Translator is a desktop app that captures a region of your screen, sends it to
Google's Gemini API using **your own API key**, and shows you the translation. This
policy covers the two ways data can leave your device.

## Your Gemini API key and captured content

Screenshots and text you capture are sent directly from your device to Google's Gemini
API, using the API key you provide in Settings. We do not operate a server, we do not
see this content, and we do not store it anywhere outside your own device (translation
history is kept locally, under your OS user profile). Google's own privacy policy and
terms govern what happens to data you send to the Gemini API.

## Anonymous usage analytics

If you opt in (or don't opt out — this is enabled by default, and always came with this
notice on first use), Screen Translator sends a small number of anonymous events to
PostHog (hosted in the EU) to help us understand how many people use the app and how
often:

- `app_started` — sent once per launch, with no properties beyond a random per-install
  identifier.
- `translation_completed` — sent once per completed translation, with your OS, the app
  version, the source→target language pair, and whether it came from a screen capture
  or a manual re-translation. **The translated text itself, the source image, and any
  other content are never included.**

The per-install identifier is a random value generated on your device the first time
analytics runs. It is not linked to your name, email, or Google account, and there is
no way for us to reverse it back to your identity.

You can turn this off at any time in Settings → General → "Share anonymous usage data".

## Changes to this policy

If we materially change what we collect, we'll show this document again the next time
you open the app, so you always know what's currently in effect.

## Contact

Questions about this policy can be raised as an issue on the project's GitHub
repository.
