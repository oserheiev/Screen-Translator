import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsProvider, useAnalyticsContext } from '../../contexts/AnalyticsContext';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { LEGAL_DOCS_HASH } from '../../legalDocs';

jest.mock('../../services/gemini.service');

function Probe() {
  const { welcomeModalMode, analyticsEnabled } = useAnalyticsContext();
  return (
    <div>
      <span data-testid="mode">{welcomeModalMode ?? 'none'}</span>
      <span data-testid="enabled">{String(analyticsEnabled)}</span>
    </div>
  );
}

function renderWithSettings(settingsResponse: any) {
  (window.electron.settings.get as jest.Mock).mockResolvedValue(settingsResponse);
  return render(
    <SettingsProvider>
      <AnalyticsProvider>
        <Probe />
      </AnalyticsProvider>
    </SettingsProvider>
  );
}

describe('AnalyticsProvider', () => {
  it('shows "new" mode when apiKey is not set and consent is undecided', async () => {
    renderWithSettings({ apiKey: '', analyticsEnabled: undefined, legalDocsHashAccepted: undefined });
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('new'));
  });

  it('shows "update" mode when apiKey is set but consent is undecided', async () => {
    renderWithSettings({ apiKey: 'existing-key', analyticsEnabled: undefined, legalDocsHashAccepted: undefined });
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('update'));
  });

  it('shows "docs-updated" mode when consent is decided but the docs hash is stale', async () => {
    renderWithSettings({ apiKey: 'existing-key', analyticsEnabled: false, legalDocsHashAccepted: 'stale-hash' });
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('docs-updated'));
    expect(screen.getByTestId('enabled')).toHaveTextContent('false');
  });

  it('shows "docs-updated" mode when consent was previously granted but the docs hash is stale', async () => {
    renderWithSettings({ apiKey: 'existing-key', analyticsEnabled: true, legalDocsHashAccepted: 'stale-hash' });
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('docs-updated'));
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
  });

  it('shows no modal when consent is decided and the docs hash matches', async () => {
    renderWithSettings({ apiKey: 'existing-key', analyticsEnabled: true, legalDocsHashAccepted: LEGAL_DOCS_HASH });
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('none'));
  });
});
