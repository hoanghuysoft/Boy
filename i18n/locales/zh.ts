// ─── Add a new screen: create i18n/locales/zh/<screenName>.ts then import it here ───

import bookmarks from './zh/bookmarks';
import create from './zh/create';
import hashtag from './zh/hashtag';
import home from './zh/home';
import languageSettings from './zh/languageSettings';
import navigation from './zh/navigation';
import onboarding from './zh/onboarding';
import post from './zh/post';
import profile from './zh/profile';
import search from './zh/search';
import settings from './zh/settings';
import shots from './zh/shots';
import themeSettings from './zh/themeSettings';

const zh = {
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
} as const;

export default zh;
