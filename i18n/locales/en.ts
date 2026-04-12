// ─── Add a new screen: create i18n/locales/en/<screenName>.ts then import it here ───

import bookmarks from './en/bookmarks';
import create from './en/create';
import hashtag from './en/hashtag';
import home from './en/home';
import languageSettings from './en/languageSettings';
import navigation from './en/navigation';
import onboarding from './en/onboarding';
import post from './en/post';
import profile from './en/profile';
import search from './en/search';
import settings from './en/settings';
import shots from './en/shots';
import themeSettings from './en/themeSettings';
import serviceSettings from './en/serviceSettings';

const en = {
    bookmarks,
    create,
    hashtag,
    home,
    settings,
    languageSettings,
    navigation,
    onboarding,
    post,
    profile,
    search,
    shots,
    themeSettings,
    serviceSettings,
} as const;

export default en;
