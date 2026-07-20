import { AppLanguage } from '../types';
import { getLocale } from '../i18n';

export interface CaptureLocale {
  instruction: string;
  processing: string;
  initializing: string;
  close: string;
}

export function getCaptureLocale(lang: string | undefined): CaptureLocale {
  return getLocale((lang as AppLanguage) ?? 'English').capture;
}
