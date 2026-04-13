// ─── Add a new screen: create i18n/locales/vi/<screenName>.ts then import it here ───

import bookmarks from './vi/bookmarks';
import create from './vi/create';
import dashboard from './vi/dashboard';
import hashtag from './vi/hashtag';
import home from './vi/home';
import languageSettings from './vi/languageSettings';
import navigation from './vi/navigation';
import onboarding from './vi/onboarding';
import post from './vi/post';
import profile from './vi/profile';
import search from './vi/search';
import settings from './vi/settings';
import shots from './vi/shots';
import themeSettings from './vi/themeSettings';
import serviceSettings from './vi/serviceSettings';
import wallpaperOverlay from './vi/wallpaperOverlay';

const vi = {
    bookmarks,
    create,
    dashboard,
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
    wallpaperOverlay,
} as const;

export default vi;
