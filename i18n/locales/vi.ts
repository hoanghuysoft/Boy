// ─── Add a new screen: create i18n/locales/vi/<screenName>.ts then import it here ───

import bookmarks from './vi/bookmarks';
import home from './vi/home';
import languageSettings from './vi/languageSettings';
import navigation from './vi/navigation';
import post from './vi/post';
import settings from './vi/settings';
import themeSettings from './vi/themeSettings';

const vi = {
    bookmarks,
    home,
    settings,
    languageSettings,
    navigation,
    post,
    themeSettings,
} as const;

export default vi;
