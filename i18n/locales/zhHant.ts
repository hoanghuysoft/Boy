import bookmarks from './zhHant/bookmarks';
import create from './zhHant/create';
import hashtag from './zhHant/hashtag';
import home from './zhHant/home';
import languageSettings from './zhHant/languageSettings';
import navigation from './zhHant/navigation';
import onboarding from './zhHant/onboarding';
import post from './zhHant/post';
import profile from './zhHant/profile';
import search from './zhHant/search';
import settings from './zhHant/settings';
import shots from './zhHant/shots';
import themeSettings from './zhHant/themeSettings';
import serviceSettings from './zhHant/serviceSettings';

const zhHant = {
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

export default zhHant;
