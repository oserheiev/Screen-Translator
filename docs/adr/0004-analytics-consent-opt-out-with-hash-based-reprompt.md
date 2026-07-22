# Analytics consent defaults to opt-out, and a legal-docs change reprompts without resetting the user's choice

The app already sits in a privacy-sensitive spot — it screenshots the user's screen and
sends crops to Gemini under the user's own API key — so before adding any outbound
analytics we had to decide how consent works, not just what data goes out. We chose an
opt-out model: a first-run (or first-launch-after-update) welcome modal presents a
pre-checked "share anonymous usage data" box alongside the bundled Privacy Policy and
Terms of Use, rather than requiring the user to actively opt in. Pure opt-in would
likely yield close to zero data for a project this size; always-on with no visible
toggle would be the one thing that could actually alarm a privacy-conscious user given
the screen-capture context. Opt-out with clear, unavoidable disclosure (the modal must
be dismissed either way) splits the difference.

We also had to decide how to detect that the Privacy Policy or Terms of Use had
changed and needed re-acknowledgement. Rather than a manually bumped version number —
the pattern already used for release notes (`Settings.lastSeenVersion`) — we hash the
bundled markdown content and compare it to `Settings.legalDocsHashAccepted`. This means
even a typo fix reprompts the user, which is more conservative than strictly
necessary, but it removes the failure mode where someone edits the legal text and
forgets to bump a version number. Critically, that reprompt only re-shows the *docs*;
it never resets `Settings.analyticsEnabled` back to its pre-checked default — a user
who previously opted out must not be silently re-enrolled just because the policy
wording changed.
