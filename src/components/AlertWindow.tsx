import React, { useEffect, useState, useLayoutEffect, useRef, useId } from 'react';
import { Theme, AppLanguage } from '../types';
import { getLocale } from '../i18n';
import { useDialogA11y } from '../hooks/useDialogA11y';

export const AlertWindow: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [locale, setLocale] = useState(() => getLocale('English'));
    const contentRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useEffect(() => {
        // Parse query params
        const params = new URLSearchParams(window.location.search);
        const lang = (params.get('lang') as AppLanguage) || 'English';
        const t = getLocale(lang);
        setLocale(t);
        setTitle(params.get('title') || t.notification);
        setMessage(params.get('message') || '');
        const paramTheme = params.get('theme') as Theme;

        // Apply theme
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');

        let themeToApply = paramTheme || 'system';
        if (themeToApply === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = prefersDark ? 'dark' : 'light';
        }
        root.classList.add(`theme-${themeToApply}`);

        // Add alert-mode class to body for base styles
        document.body.classList.add('alert-mode');

        // Cleanup function (optional, but good practice if checking lifecycle)
        return () => {
            document.body.classList.remove('alert-mode');
            root.classList.remove(`theme-${themeToApply}`);
        };
    }, []);

    useLayoutEffect(() => {
        if (contentRef.current && window.electron?.alert?.resize) {
            const height = contentRef.current.scrollHeight;
            const safeHeight = Math.max(height, 150);
            window.electron.alert.resize(400, safeHeight + 2);
        }
    }, [title, message]);

    const handleClose = async () => {
        if (window.electron?.alert?.close) {
            await window.electron.alert.close();
        }
    };

    useDialogA11y(contentRef, handleClose);

    return (
        <div ref={contentRef} className="alert-window" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="alert-header">
                <h2 id={titleId}>{title}</h2>
                <button
                    className="alert-close-button"
                    onClick={handleClose}
                    aria-label={locale.close}
                    title={locale.close}
                >×</button>
            </div>

            <div className="alert-content">
                <p className="alert-message">{message}</p>
            </div>

            <div className="alert-footer">
                <button
                    type="button"
                    className="save-button alert-ok-button"
                    onClick={handleClose}
                >
                    {locale.ok}
                </button>
            </div>
        </div>
    );
};

export default AlertWindow;
