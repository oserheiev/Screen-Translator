import { useAppContext } from '../contexts/AppContext';
import { getLocale, LocaleStrings } from './index';

export function useLocale(): LocaleStrings {
  const { appLanguage } = useAppContext();
  return getLocale(appLanguage);
}
