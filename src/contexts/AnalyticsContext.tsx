import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useElectronIpc } from '../hooks/useElectronIpc';
import { useSettingsContext } from './SettingsContext';
import { LEGAL_DOCS_HASH } from '../legalDocs';
import { WelcomeModalMode as WelcomeModalModeNonNull } from '../components/WelcomeModal';

// AnalyticsContext's mode adds `null` (no modal to show) on top of WelcomeModal's
// own mode type — WelcomeModal itself is only ever rendered once this is non-null.
export type WelcomeModalMode = WelcomeModalModeNonNull | null;

interface AnalyticsContextType {
  welcomeModalMode: WelcomeModalMode;
  analyticsEnabled: boolean | undefined;
  completeWelcome: (consent: boolean) => void;
  setAnalyticsEnabled: (value: boolean) => void;
}

const defaultContext: AnalyticsContextType = {
  welcomeModalMode: null,
  analyticsEnabled: undefined,
  completeWelcome: () => {},
  setAnalyticsEnabled: () => {},
};

const AnalyticsContext = createContext<AnalyticsContextType>(defaultContext);

export const useAnalyticsContext = () => useContext(AnalyticsContext);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { getSettings, isElectronAvailable } = useElectronIpc();
  const { settingsLoaded, apiKey } = useSettingsContext();
  const [loaded, setLoaded] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabledState] = useState<boolean | undefined>(undefined);
  const [legalDocsHashAccepted, setLegalDocsHashAccepted] = useState<string | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      if (!isElectronAvailable) { setLoaded(true); return; }
      try {
        const settings = await getSettings();
        setAnalyticsEnabledState(settings?.analyticsEnabled);
        setLegalDocsHashAccepted(settings?.legalDocsHashAccepted);
      } catch (error) {
        console.error('Failed to load analytics consent state:', error);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, [getSettings, isElectronAvailable]);

  const welcomeModalMode: WelcomeModalMode = !loaded || !settingsLoaded
    ? null
    : analyticsEnabled === undefined
      ? (apiKey ? 'update' : 'new')
      : legalDocsHashAccepted !== LEGAL_DOCS_HASH
        ? 'docs-updated'
        : null;

  const completeWelcome = useCallback((consent: boolean) => {
    setAnalyticsEnabledState(consent);
    setLegalDocsHashAccepted(LEGAL_DOCS_HASH);
    window.electron.settings.save({ analyticsEnabled: consent, legalDocsHashAccepted: LEGAL_DOCS_HASH }).catch(console.error);
  }, []);

  const setAnalyticsEnabled = useCallback((value: boolean) => {
    setAnalyticsEnabledState(value);
    window.electron.settings.save({ analyticsEnabled: value }).catch(console.error);
  }, []);

  const value: AnalyticsContextType = {
    welcomeModalMode,
    analyticsEnabled,
    completeWelcome,
    setAnalyticsEnabled,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};
