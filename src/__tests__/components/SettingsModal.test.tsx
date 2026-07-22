import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../contexts/AppContext';
import SettingsModal from '../../components/SettingsModal';

jest.mock('../../services/gemini.service');

function renderModal(overrides: Partial<React.ComponentProps<typeof SettingsModal>> = {}) {
  const onClose = jest.fn();
  const onAnalyticsEnabledChange = jest.fn();
  const props: React.ComponentProps<typeof SettingsModal> = {
    apiKey: 'valid-key',
    hotkey: 'Ctrl+Shift+T',
    availableModels: ['gemini-2.5-flash'],
    selectedModel: 'gemini-2.5-flash',
    appLanguage: 'English',
    theme: 'system',
    alwaysOnTop: false,
    launchAtStartup: false,
    startMinimizedToTray: false,
    onApiKeyChange: jest.fn(),
    onHotkeyChange: jest.fn(),
    onModelChange: jest.fn(),
    onAppLanguageChange: jest.fn(),
    onThemeChange: jest.fn(),
    onAlwaysOnTopChange: jest.fn(),
    onLaunchAtStartupChange: jest.fn(),
    onStartMinimizedToTrayChange: jest.fn(),
    analyticsEnabled: true,
    onAnalyticsEnabledChange,
    onClose,
    ...overrides,
  };

  render(
    <AppProvider>
      <SettingsModal {...props} />
    </AppProvider>
  );

  return { onClose, onAnalyticsEnabledChange };
}

describe('SettingsModal', () => {
  it('renders the analytics toggle checked according to the analyticsEnabled prop', async () => {
    renderModal({ analyticsEnabled: true });

    expect(await screen.findByLabelText('Share anonymous usage data')).toBeChecked();
  });

  it('renders the Privacy Policy and Terms of Use links', async () => {
    renderModal();

    expect(await screen.findByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
  });

  it('opens the Privacy Policy legal document modal when clicked', async () => {
    renderModal();

    await userEvent.click(await screen.findByText('Privacy Policy'));

    expect(await screen.findAllByText('Privacy Policy')).not.toHaveLength(0);
    expect(document.querySelector('.legal-document-modal')).toBeInTheDocument();
  });

  it('opens the Terms of Use legal document modal when clicked', async () => {
    renderModal();

    await userEvent.click(await screen.findByText('Terms of Use'));

    expect(document.querySelector('.legal-document-modal')).toBeInTheDocument();
  });

  it('toggles and saves the analytics consent setting', async () => {
    const { onAnalyticsEnabledChange } = renderModal({ analyticsEnabled: true });

    await userEvent.click(await screen.findByLabelText('Share anonymous usage data'));
    await userEvent.click(screen.getByText('Save'));

    expect(onAnalyticsEnabledChange).toHaveBeenCalledWith(false);
  });
});
