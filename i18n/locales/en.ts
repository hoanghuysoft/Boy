// ─── Add a new screen: create i18n/locales/en/<screenName>.ts then import it here ───

import bookmarks from './en/bookmarks';
import home from './en/home';
import languageSettings from './en/languageSettings';
import navigation from './en/navigation';
import post from './en/post';
import settings from './en/settings';
import themeSettings from './en/themeSettings';

const en = {
    bookmarks,
    home,
    settings,
    languageSettings,
    navigation,
    post,
    themeSettings,
} as const;

export default en;
