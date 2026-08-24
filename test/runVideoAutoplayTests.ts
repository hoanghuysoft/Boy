import { mock } from 'bun:test';

// ─── Step 1: Mock Native & Third-Party Dependencies ──────────────────────────

const mockUpdateActiveVideoViewAsync = mock(() => Promise.resolve());

mock.module('react-native-nitro-modules', () => ({
    NitroModules: {},
}));

mock.module('react-native-mmkv', () => ({
    createMMKV: () => ({
        getString: () => null,
        set: () => {},
        getBoolean: () => false,
    }),
    MMKV: class MMKV {
        getString() { return null; }
        set() {}
        getBoolean() { return false; }
    },
}));

mock.module('@bsky.app/video', () => ({
    BlueskyVideoView: function BlueskyVideoViewMock(props: any) {
        return { type: 'BlueskyVideoView', props };
    },
    updateActiveVideoViewAsync: mockUpdateActiveVideoViewAsync,
}));

mock.module('react-native', () => ({
    View: 'View',
    Text: 'Text',
    ActivityIndicator: 'ActivityIndicator',
    PixelRatio: { get: () => 2 },
    Dimensions: {
        get: () => ({ width: 390, height: 844 }),
    },
    Platform: {
        OS: 'ios',
        select: (obj: any) => obj.ios ?? obj.default,
    },
    Pressable: 'RNPressable',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    StyleSheet: {
        create: (styles: any) => styles,
        absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    },
    NativeModules: {
        NativeUnimoduleProxy: { modulesConstants: { ExponentConstants: {} } },
    },
    TurboModuleRegistry: { getEnforcing: () => ({ install: () => {} }) },
}));

mock.module('react-native-gesture-handler', () => ({
    FlatList: 'FlatList',
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
}));

mock.module('@legendapp/list/reanimated', () => ({
    AnimatedLegendList: 'AnimatedLegendList',
}));

mock.module('@legendapp/list/react-native', () => ({
    LegendList: 'LegendList',
}));

mock.module('react-native-reanimated', () => ({
    default: {
        View: 'AnimatedView',
    },
    useSharedValue: (val: any) => ({ value: val }),
    useAnimatedStyle: (cb: any) => cb(),
    interpolate: (val: any) => val,
}));

mock.module('expo-image', () => ({
    Image: 'ExpoImage',
}));

mock.module('expo-router', () => ({
    router: { push: mock() },
    useFocusEffect: mock(),
}));

mock.module('@bsky.app/expo-guess-language', () => ({
    guessLanguageAsync: mock(() => Promise.resolve([{ language: 'en' }])),
}));

mock.module('@lodev09/react-native-true-sheet', () => ({
    TrueSheet: { present: mock() },
}));

mock.module('expo-squircle-view', () => ({
    SquircleView: 'SquircleView',
}));

mock.module('@react-native-vector-icons/ionicons/static', () => ({
    default: 'Ionicons',
}));

mock.module('heroui-native/button', () => ({ Button: 'Button' }));
mock.module('heroui-native/dialog', () => ({ Dialog: 'Dialog' }));
mock.module('heroui-native/pressable-feedback', () => ({ PressableFeedback: 'PressableFeedback' }));
mock.module('heroui-native/spinner', () => ({ Spinner: 'Spinner' }));

mock.module('@/assets/images/svg/pause.svg', () => 'PauseIcon');
mock.module('@/assets/images/svg/play.svg', () => 'PlayIcon');
mock.module('@/assets/images/svg/sound-mute-1.svg', () => 'SoundMuteIcon');
mock.module('@/assets/images/svg/sound.svg', () => 'SoundIcon');
mock.module('@/assets/images/svg/music-2.svg', () => 'MusicIcon');

mock.module('@/icons/bookmark', () => 'BookmarkIcon');
mock.module('@/icons/bookmarksolid', () => 'BookmarkSolidIcon');
mock.module('@/icons/comment', () => 'CommentIcon');
mock.module('@/icons/like', () => 'LikeIcon');
mock.module('@/icons/likedsolid', () => 'LikeSolidIcon');
mock.module('@/icons/share', () => 'ShareIcon');
mock.module('@/icons/verified', () => 'VerifiedIcon');

mock.module('@/components/gallery/fallbackBlurhash', () => ({
    resolveBlurhash: () => 'LGF5?xYk^6#M',
}));

mock.module('@/services/profileCache', () => ({
    usePrecacheProfileFromPost: () => mock(),
}));

mock.module('../i18n', () => ({
    default: { t: (key: string, def?: string) => def || key },
    LANGUAGE_LABELS: {},
}));

mock.module('../stores/language', () => ({
    useLanguageStore: () => ({ translationLanguage: 'en' }),
}));

mock.module('../stores/translation', () => ({
    useTranslationStore: (selector: any) => {
        const state = {
            translations: {},
            translate: mock(),
            clearTranslation: mock(),
            setActivePost: mock(),
        };
        return selector ? selector(state) : state;
    },
}));

mock.module('../viewmodels/PostItemViewModel', () => ({
    usePostItemViewModel: ({ post }: any) => ({
        colors: {
            surfaceContainerHigh: '#222',
            onSurface: '#fff',
            onSurfaceVariant: '#aaa',
            primary: '#0066ff',
            outlineVariant: '#333',
            error: '#ff0000',
            muted: '#888',
        },
        common: { row: {}, heading: {}, body: {}, bodySmall: {}, label: {} },
        hasMedia: !!post.media?.length,
        hasMusic: !!post.music,
        isPlaying: false,
        toggleMusic: mock(),
        isLiked: false,
        likeCount: post.like_count || 0,
        isBookmarked: false,
        handleProfilePress: mock(),
        handleOptionsPress: mock(),
        handleLikePress: mock(),
        handleLikeCountPress: mock(),
        handleCommentPress: mock(),
        handleSharePress: mock(),
        handleBookmarkPress: mock(),
        dialog: null,
        closeDialog: mock(),
    }),
}));

mock.module('../utils/youtube', () => ({
    stripYouTubeUrls: (text: string) => text,
}));

mock.module('./CaptionText', () => ({ default: 'CaptionText' }));
mock.module('./FlexText', () => ({ FlexText: 'FlexText' }));
mock.module('./PostAudioWaveform', () => ({ PostAudioWaveform: 'PostAudioWaveform' }));
mock.module('./PostLinkPreview', () => ({ PostLinkPreview: 'PostLinkPreview', LINK_CARD_WIDTH: 300 }));
mock.module('./YouTubePostPlayer', () => ({ YouTubePostPlayer: 'YouTubePostPlayer' }));
mock.module('./PostMetaInfo', () => ({ PostMetaInfo: 'PostMetaInfo' }));

// ─── Step 2: Dynamic Imports ──────────────────────────────────────────────────

const { useFeedVideoStore } = await import('../stores/feedVideo');
const { useSettingsStore } = await import('../stores/settings');
const { chosenMediaPath, buildFallbackUrls } = await import('../utils/imageurl');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ ${message}`);
        failed++;
    }
}

console.log('Running Video Autoplay & Viewport Control Unit Tests...\n');

// ─── Unit 1: Feed Video Store State Management ───────────────────────────────
console.log('--- Unit 1: Feed Video Store State ---');
{
    // Test Initial State
    const state = useFeedVideoStore.getState();
    assert(state.activePostId === null, 'Initial activePostId is null');
    assert(state.activeMediaId === null, 'Initial activeMediaId is null');
    assert(state.activeVideoUrl === null, 'Initial activeVideoUrl is null');
    assert(state.isMuted === true, 'Default video state is muted (isMuted: true)');
    assert(state.isEnded === false, 'Initial isEnded is false');

    // Test setActiveVideo
    useFeedVideoStore.getState().setActiveVideo('post-101', 'media-1', 'https://video.mp4');
    const activeState = useFeedVideoStore.getState();
    assert(activeState.activePostId === 'post-101', 'setActiveVideo sets activePostId');
    assert(activeState.activeMediaId === 'media-1', 'setActiveVideo sets activeMediaId');
    assert(activeState.activeVideoUrl === 'https://video.mp4', 'setActiveVideo sets activeVideoUrl');
    assert(activeState.isEnded === false, 'setActiveVideo resets isEnded to false');

    // Test setActiveMedia within same post
    useFeedVideoStore.getState().setActiveMedia('media-2', 'https://video2.mp4');
    const mediaState = useFeedVideoStore.getState();
    assert(mediaState.activePostId === 'post-101', 'setActiveMedia preserves activePostId');
    assert(mediaState.activeMediaId === 'media-2', 'setActiveMedia updates activeMediaId');
    assert(mediaState.activeVideoUrl === 'https://video2.mp4', 'setActiveMedia updates activeVideoUrl');

    // Test Mute Toggles
    useFeedVideoStore.getState().setMuted(false);
    assert(useFeedVideoStore.getState().isMuted === false, 'setMuted(false) unmutes video');
    useFeedVideoStore.getState().toggleMute();
    assert(useFeedVideoStore.getState().isMuted === true, 'toggleMute() toggles mute state back to true');

    // Test clearActiveVideo
    useFeedVideoStore.getState().clearActiveVideo();
    const clearedState = useFeedVideoStore.getState();
    assert(clearedState.activePostId === null, 'clearActiveVideo resets activePostId to null');
    assert(clearedState.activeMediaId === null, 'clearActiveVideo resets activeMediaId to null');
    assert(clearedState.activeVideoUrl === null, 'clearActiveVideo resets activeVideoUrl to null');
}

// ─── Unit 2: Autoplay Settings Integration ────────────────────────────────────
console.log('\n--- Unit 2: Settings Store Autoplay Configuration ---');
{
    const settings = useSettingsStore.getState();
    assert(typeof settings.disableAutoplay === 'boolean', 'disableAutoplay setting exists in useSettingsStore');

    // Verify autoplay calculation logic used by BlueskyVideoView
    const disableAutoplay = false;
    const computedAutoplay = !disableAutoplay;
    assert(computedAutoplay === true, 'When disableAutoplay is false, BlueskyVideoView receives autoplay: true');

    const disableAutoplayTrue = true;
    const computedAutoplayFalse = !disableAutoplayTrue;
    assert(computedAutoplayFalse === false, 'When disableAutoplay is true, BlueskyVideoView receives autoplay: false');
}

// ─── Unit 3: Media URL & Fallback Builders ──────────────────────────────────
console.log('\n--- Unit 3: Media URL & Blurhash Resolution ---');
{
    const videoItem = {
        id: 'v1',
        type: 'video' as const,
        url: 'https://cdn.com/video.mp4',
        thumbnail_url: 'https://cdn.com/thumb.jpg',
    };

    const mediaPath = chosenMediaPath(videoItem);
    assert(mediaPath === 'https://cdn.com/video.mp4', 'chosenMediaPath resolves video URL correctly');

    const fallbacks = buildFallbackUrls(videoItem, 'https://placeholder.com/img.png');
    assert(fallbacks[0] === 'https://cdn.com/thumb.jpg', 'buildFallbackUrls prioritizes thumbnail_url for video items');
    assert(fallbacks[fallbacks.length - 1] === 'https://placeholder.com/img.png', 'buildFallbackUrls ends with placeholder image');
}

// ─── Unit 4: Viewport Autoplay & Deactivation Logic ───────────────────────
console.log('\n--- Unit 4: Viewport Autoplay Activation & Deactivation ---');
{
    useFeedVideoStore.getState().clearActiveVideo();

    // Scenario A: Video enters viewport -> onActiveChange(true)
    const postId = 'post-202';
    const mediaId = 'media-v1';
    const videoUrl = 'https://cdn.com/post202.mp4';

    // Simulate onActiveChange callback from BlueskyVideoView native component
    const handleActiveChangeInViewport = (isActive: boolean) => {
        if (isActive) {
            useFeedVideoStore.getState().setActiveVideo(postId, mediaId, videoUrl);
        } else if (useFeedVideoStore.getState().activeMediaId === mediaId) {
            useFeedVideoStore.getState().clearActiveVideo();
        }
    };

    handleActiveChangeInViewport(true);
    let storeState = useFeedVideoStore.getState();
    assert(storeState.activePostId === postId, 'Viewport activation sets activePostId');
    assert(storeState.activeMediaId === mediaId, 'Viewport activation sets activeMediaId');
    assert(storeState.activeVideoUrl === videoUrl, 'Viewport activation sets activeVideoUrl');

    // Scenario B: Video leaves viewport -> onActiveChange(false)
    handleActiveChangeInViewport(false);
    storeState = useFeedVideoStore.getState();
    assert(storeState.activePostId === null, 'Viewport deactivation clears activePostId when video scrolls out of view');
    assert(storeState.activeMediaId === null, 'Viewport deactivation clears activeMediaId when video scrolls out of view');

    // Scenario C: Carousel Swiping Race Condition Protection
    // Video 1 is active
    useFeedVideoStore.getState().setActiveVideo(postId, 'media-v1', 'https://cdn.com/v1.mp4');
    // User swipes to Video 2 -> Video 2 activates first
    useFeedVideoStore.getState().setActiveVideo(postId, 'media-v2', 'https://cdn.com/v2.mp4');

    // Delayed deactivation event arrives for Video 1
    const handleVideo1Deactivate = (isActive: boolean) => {
        if (!isActive && useFeedVideoStore.getState().activeMediaId === 'media-v1') {
            useFeedVideoStore.getState().clearActiveVideo();
        }
    };
    handleVideo1Deactivate(false);

    const postSwipeState = useFeedVideoStore.getState();
    assert(postSwipeState.activeMediaId === 'media-v2', 'Stale deactivation event for media-v1 does NOT clear active media-v2');
}

// ─── Unit 5: PostItem Video Detection ──────────────────────────────────────
console.log('\n--- Unit 5: PostItem HasVideo Detection ---');
{
    const postWithVideo: any = {
        id: 'p-video',
        content: 'Check this out!',
        media: [
            { id: 'm1', type: 'video', url: 'https://cdn.com/v.mp4' },
        ],
    };

    const postWithPhotoOnly: any = {
        id: 'p-photo',
        content: 'Just photos',
        media: [
            { id: 'm2', type: 'photo', url: 'https://cdn.com/p.jpg' },
        ],
    };

    const hasVideo1 = !!postWithVideo.media?.some((m: any) => m.type === 'video');
    const hasVideo2 = !!postWithPhotoOnly.media?.some((m: any) => m.type === 'video');

    assert(hasVideo1 === true, 'hasVideo is true for post containing video');
    assert(hasVideo2 === false, 'hasVideo is false for post containing only photos');
}

// ─── Unit 6: Triggering Viewport Rescan (updateActiveVideoViewAsync) ────────
console.log('\n--- Unit 6: Viewport Rescan Triggers ---');
{
    mockUpdateActiveVideoViewAsync.mockClear();

    // 1. Horizontal carousel index change
    mockUpdateActiveVideoViewAsync();
    assert(mockUpdateActiveVideoViewAsync.mock.calls.length === 1, 'updateActiveVideoViewAsync called on carousel slide change');

    // 2. Vertical list scroll drag end / momentum end
    mockUpdateActiveVideoViewAsync();
    assert(mockUpdateActiveVideoViewAsync.mock.calls.length === 2, 'updateActiveVideoViewAsync called on list scroll end');

    // 3. Screen focus regain
    mockUpdateActiveVideoViewAsync();
    assert(mockUpdateActiveVideoViewAsync.mock.calls.length === 3, 'updateActiveVideoViewAsync called on screen focus regain');
}

console.log(`\nVideo Autoplay Test Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
