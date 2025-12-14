import { useEffect, useCallback } from 'react';
import { ElectronAPI } from '../types';

export const useElectronIpc = () => {
    const electron = window.electron as ElectronAPI | undefined;

    const isElectronAvailable = !!electron;

    const startCapture = useCallback(async () => {
        if (electron) {
            try {
                await electron.capture.start();
                return true;
            } catch (error) {
                console.error('Failed to start capture:', error);
                return false;
            }
        }
        return false;
    }, [electron]);

    const onImageCaptured = useCallback((callback: (imageData: string) => void) => {
        if (electron) {
            const removeListener = electron.on('image-captured', (imageData: string) => {
                callback(imageData);
            });
            return removeListener;
        }
        return () => { };
    }, [electron]);

    const showWindow = useCallback(async () => {
        if (electron?.window?.show) {
            try {
                await electron.window.show();
            } catch (error) {
                console.error('Failed to show window:', error);
            }
        }
    }, [electron]);

    const saveSettings = useCallback(async (settings: any) => {
        if (electron) {
            return await electron.settings.save(settings);
        }
        return false;
    }, [electron]);

    const getSettings = useCallback(async () => {
        if (electron) {
            return await electron.settings.get();
        }
        return null;
    }, [electron]);

    const getPlatform = useCallback(async () => {
        if (electron) {
            return await electron.platform.getPlatform();
        }
        return 'web';
    }, [electron]);

    return {
        isElectronAvailable,
        startCapture,
        onImageCaptured,
        showWindow,
        saveSettings,
        getSettings,
        getPlatform
    };
};
