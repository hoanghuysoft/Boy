// ─── Add a new screen: create i18n/locales/vi/<screenName>.ts then import it here ───

import bookmarks from './vi/bookmarks';
import create from './vi/create';
import hashtag from './vi/hashtag';
import home from './vi/home';
import languageSettings from './vi/languageSettings';
import navigation from './vi/navigation';
import post from './vi/post';
import profile from './vi/profile';
import search from './vi/search';
import settings from './vi/settings';
import shots from './vi/shots';
import themeSettings from './vi/themeSettings';

const vi = {
    bookmarks,
    create,
    hashtag,
    home,
    settings,
    languageSettings,
    navigation,
    post,
    profile,
    search,
    shots,
    themeSettings,
} as const;

export default vi;
