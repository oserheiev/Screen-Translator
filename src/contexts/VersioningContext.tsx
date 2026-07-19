import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useElectronIpc } from '../hooks/useElectronIpc';
import { WhatsNewEntry, WhatsNewBullet, WHATS_NEW, getUnseenEntries, compareVersions } from '../whatsnew';

export type UpdateStatus = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

interface VersioningContextType {
  updateStatus: UpdateStatus;
  updateVersion: string | null;
  updateProgress: number;
  appVersion: string;
  whatsNewEntries: WhatsNewEntry[];
  updatePromptVersion: string | null;
  updatePreviewBullets: WhatsNewBullet[] | null;
  handleDownloadUpdate: () => void;
  handleInstallUpdate: () => void;
  dismissWhatsNew: () => void;
  dismissUpdatePrompt: () => void;
  ignoreUpdateVersion: () => void;
}

const defaultContext: VersioningContextType = {
  updateStatus: 'idle',
  updateVersion: null,
  updateProgress: 0,
  appVersion: '1.0.0',
  whatsNewEntries: [],
  updatePromptVersion: null,
  updatePreviewBullets: null,
  handleDownloadUpdate: () => {},
  handleInstallUpdate: () => {},
  dismissWhatsNew: () => {},
  dismissUpdatePrompt: () => {},
  ignoreUpdateVersion: () => {},
};

const VersioningContext = createContext<VersioningContextType>(defaultContext);

export const useVersioningContext = () => useContext(VersioningContext);

interface VersioningProviderProps {
  children: React.ReactNode;
}

export const VersioningProvider: React.FC<VersioningProviderProps> = ({ children }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [whatsNewEntries, setWhatsNewEntries] = useState<WhatsNewEntry[]>([]);

  // undefined = settings not loaded yet (suppresses the prompt until we know what's ignored)
  const [ignoredUpdateVersion, setIgnoredUpdateVersion] = useState<string | null | undefined>(undefined);
  const [updatePromptDismissed, setUpdatePromptDismissed] = useState<string | null>(null);
  const [updatePreviewBullets, setUpdatePreviewBullets] = useState<WhatsNewBullet[] | null>(null);

  const { getSettings, isElectronAvailable } = useElectronIpc();

  useEffect(() => {
    const loadVersionState = async () => {
      try {
        if (!isElectronAvailable) return;

        const settings = await getSettings();
        setIgnoredUpdateVersion(settings?.ignoredUpdateVersion ?? null);

        const savedHistory = await window.electron.history.get();

        const version = await window.electron.app.getVersion();
        if (version) {
          setAppVersion(version);

          const lastSeen: string | null = settings?.lastSeenVersion ?? null;
          const isFreshInstall = !settings?.apiKey && (savedHistory ?? []).length === 0;
          if (lastSeen === null && isFreshInstall) {
            window.electron.settings.save({ lastSeenVersion: version }).catch(console.error);
          } else if (lastSeen === null || compareVersions(lastSeen, version) < 0) {
            const unseen = getUnseenEntries(lastSeen, version, WHATS_NEW);
            if (unseen.length > 0) {
              setWhatsNewEntries(unseen);
            } else {
              window.electron.settings.save({ lastSeenVersion: version }).catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load version state:', error);
        setIgnoredUpdateVersion(null);
      }
    };

    loadVersionState();
  }, [getSettings, isElectronAvailable]);

  useEffect(() => {
    if (!isElectronAvailable) return;

    const removeUpdateAvailable = window.electron.on('update-available', (info: { version: string; downloaded?: boolean; previewBullets?: WhatsNewBullet[] | null }) => {
      setUpdateVersion(info.version);
      setUpdateStatus(info.downloaded ? 'ready' : 'available');
      setUpdatePreviewBullets(info.previewBullets ?? null);
    });

    const removeUpdateProgress = window.electron.on('update-progress', (percent: number) => {
      setUpdateProgress(percent);
      setUpdateStatus('downloading');
    });

    const removeUpdateError = window.electron.on('update-error', () => {
      setUpdateStatus('error');
    });

    return () => {
      removeUpdateAvailable();
      removeUpdateProgress();
      removeUpdateError();
    };
  }, [isElectronAvailable]);

  const handleDownloadUpdate = useCallback(() => {
    window.electron.updater.download();
    setUpdateStatus('downloading');
  }, []);

  const handleInstallUpdate = useCallback(() => {
    window.electron.updater.install();
  }, []);

  const dismissWhatsNew = useCallback(() => {
    setWhatsNewEntries([]);
    window.electron.settings.save({ lastSeenVersion: appVersion }).catch(console.error);
  }, [appVersion]);

  const updatePromptVersion =
    updateStatus === 'available' &&
    updateVersion !== null &&
    ignoredUpdateVersion !== undefined &&
    updateVersion !== ignoredUpdateVersion &&
    updateVersion !== updatePromptDismissed
      ? updateVersion
      : null;

  const dismissUpdatePrompt = useCallback(() => {
    setUpdatePromptDismissed(updateVersion);
  }, [updateVersion]);

  const ignoreUpdateVersion = useCallback(() => {
    if (!updateVersion) return;
    setIgnoredUpdateVersion(updateVersion);
    window.electron.settings.save({ ignoredUpdateVersion: updateVersion }).catch(console.error);
  }, [updateVersion]);

  const value: VersioningContextType = {
    updateStatus,
    updateVersion,
    updateProgress,
    appVersion,
    whatsNewEntries,
    updatePromptVersion,
    updatePreviewBullets,
    handleDownloadUpdate,
    handleInstallUpdate,
    dismissWhatsNew,
    dismissUpdatePrompt,
    ignoreUpdateVersion,
  };

  return <VersioningContext.Provider value={value}>{children}</VersioningContext.Provider>;
};
