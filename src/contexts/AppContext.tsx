import React from 'react';
import { SettingsProvider, useSettingsContext } from './SettingsContext';
import { TranslationProvider, useTranslationContext } from './TranslationContext';
import { VersioningProvider, useVersioningContext } from './VersioningContext';

export type { UpdateStatus } from './VersioningContext';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Composes the Settings / Translation+History / Versioning contexts.
 * Nested in this order because TranslationProvider reads settings
 * (apiKey, language pair, model, …) to perform translations.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }: AppProviderProps) => (
  <SettingsProvider>
    <TranslationProvider>
      <VersioningProvider>{children}</VersioningProvider>
    </TranslationProvider>
  </SettingsProvider>
);

/**
 * Back-compat facade merging all three contexts into one flat object,
 * for consumers that don't need fine-grained re-render isolation.
 * Prefer useSettingsContext / useTranslationContext / useVersioningContext
 * directly in new code.
 */
export function useAppContext() {
  const settings = useSettingsContext();
  const translation = useTranslationContext();
  const versioning = useVersioningContext();
  return { ...settings, ...translation, ...versioning };
}
