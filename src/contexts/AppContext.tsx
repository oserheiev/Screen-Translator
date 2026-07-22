import React from 'react';
import { SettingsProvider, useSettingsContext } from './SettingsContext';
import { TranslationProvider, useTranslationContext } from './TranslationContext';
import { VersioningProvider, useVersioningContext } from './VersioningContext';
import { AnalyticsProvider, useAnalyticsContext } from './AnalyticsContext';

export type { UpdateStatus } from './VersioningContext';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Composes the Settings / Analytics / Translation+History / Versioning contexts.
 * Nested in this order because TranslationProvider reads settings
 * (apiKey, language pair, model, …) to perform translations, and
 * AnalyticsProvider reads settings (apiKey) to derive the welcome modal mode.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }: AppProviderProps) => (
  <SettingsProvider>
    <AnalyticsProvider>
      <TranslationProvider>
        <VersioningProvider>{children}</VersioningProvider>
      </TranslationProvider>
    </AnalyticsProvider>
  </SettingsProvider>
);

/**
 * Back-compat facade merging all four contexts into one flat object,
 * for consumers that don't need fine-grained re-render isolation.
 * Prefer useSettingsContext / useTranslationContext / useVersioningContext /
 * useAnalyticsContext directly in new code.
 */
export function useAppContext() {
  const settings = useSettingsContext();
  const translation = useTranslationContext();
  const versioning = useVersioningContext();
  const analytics = useAnalyticsContext();
  return { ...settings, ...translation, ...versioning, ...analytics };
}
