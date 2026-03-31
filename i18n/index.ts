import { getLocales } from 'expo-localization';
import dayjs from 'dayjs';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createMMKV } from 'react-native-mmkv';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';

import en from './locales/en';
import vi from './locales/vi';

// ─── Supported languages ──────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
};

const DAYJS_LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
    en: 'en',
    vi: 'vi',
};

// ─── MMKV storage (shared with language store) ────────────────────────────────

export const LANGUAGE_KEY = 'app-language';
export const LANGUAGE_MODE_KEY = 'app-language-mode';
export const languageStorage = createMMKV({ id: 'language-storage' });

// ─── Resolve the device locale to a supported language ───────────────────────

export const getDeviceLanguage = (): SupportedLanguage => {
    const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLocale)
        ? (deviceLocale as SupportedLanguage)
        : 'en';
};

// ─── Resolve the language to boot with ───────────────────────────────────────
// Priority: 1) manual selection in MMKV  2) auto (device locale)  3) 'en'

const getInitialLanguage = (): SupportedLanguage => {
    const mode = languageStorage.getString(LANGUAGE_MODE_KEY);
    if (mode === 'manual') {
        const saved = languageStorage.getString(LANGUAGE_KEY);
        if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
            return saved as SupportedLanguage;
        }
    }
    return getDeviceLanguage();
};

const applyDayjsLocale = (language: SupportedLanguage) => {
    dayjs.locale(DAYJS_LOCALE_BY_LANGUAGE[language]);
};

// ─── i18next initialisation ───────────────────────────────────────────────────

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        vi: { translation: vi },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

// Keep dayjs locale in sync with app language globally.
applyDayjsLocale(getInitialLanguage());
i18n.on('languageChanged', (lng) => {
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lng)) {
        applyDayjsLocale(lng as SupportedLanguage);
    }
});

export default i18n;

// ─── TypeScript: full autocomplete for t() ───────────────────────────────────

type EnTranslation = typeof en;

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: EnTranslation;
        };
    }
}
