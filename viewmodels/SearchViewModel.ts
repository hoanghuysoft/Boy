import { queryClient } from "@/services/client";
import { ProfilesResponse, useAdminCheck, useInfiniteProfiles } from "@/services/userprofile";
import { useScrollStore } from "@/stores/scroll";
import { Profile } from "@/types/profile";
import { debounce, flatMap } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Platform, TextInput } from "react-native";
import {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TurboImage from "react-native-turbo-image";

// Native spring config for smoother keyboard animations
const KEYBOARD_SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

// Bottom navigation layout constants
const BOTTOM_NAV_HEIGHT = 67;
const BOTTOM_NAV_MARGIN = 13;
const SEARCH_BAR_HEIGHT = 56;

export const useSearchViewModel = () => {
    const insets = useSafeAreaInsets();

    // ─── Search State ──────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const listRef = useRef<any>(null);

    // ─── Auth / Admin Check ─────────────────────────────────────────
    const { data: adminData } = useAdminCheck();
    const isAdmin = adminData?.isAdmin ?? false;

    // ─── Data Fetching ─────────────────────────────────────────────
    // Admin: load all profiles on mount. Non-admin: only fetch when searching.
    const isQueryEnabled = isAdmin || debouncedSearchQuery.length > 0;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
        isLoading,
    } = useInfiniteProfiles(debouncedSearchQuery, isQueryEnabled);

    const profiles = useMemo(() => {
        return flatMap(data?.pages, (page: ProfilesResponse) => page.data);
    }, [data]);

    const totalResults = useMemo(() => {
        if (!data?.pages?.length) return 0;
        const firstPage = data.pages[0];
        if (debouncedSearchQuery && firstPage.pagination.totalMatches !== undefined) {
            return firstPage.pagination.totalMatches;
        }
        return firstPage.pagination.total;
    }, [data, debouncedSearchQuery]);

    // ─── Debounced Search ──────────────────────────────────────────
    const debouncedHandler = useMemo(
        () => debounce((text: string) => setDebouncedSearchQuery(text), 300),
        []
    );

    useEffect(() => {
        return () => {
            debouncedHandler.cancel();
        };
    }, [debouncedHandler]);

    const handleSearchChange = useCallback(
        (text: string) => {
            setSearchQuery(text);
            debouncedHandler(text);
        },
        [debouncedHandler]
    );

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setDebouncedSearchQuery("");
        inputRef.current?.blur();
        Keyboard.dismiss();
    }, []);

    // ─── Focus / Blur ─────────────────────────────────────────────
    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    // ─── Keyboard Blur on Hide ────────────────────────────────────
    useEffect(() => {
        const keyboardListener = Keyboard.addListener("keyboardDidHide", () => {
            inputRef.current?.blur();
        });
        return () => keyboardListener.remove();
    }, []);

    // ─── Keyboard Animation ───────────────────────────────────────
    const searchBarTranslateY = useSharedValue(0);

    const baseSearchBarBottom =
        BOTTOM_NAV_HEIGHT + BOTTOM_NAV_MARGIN + insets.bottom + 16;
    const contentBottomPadding = baseSearchBarBottom + SEARCH_BAR_HEIGHT + 16;

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSubscription = Keyboard.addListener(showEvent, (e) => {
            const keyboardHeight = e.endCoordinates.height;
            const bottomNavSpace =
                BOTTOM_NAV_HEIGHT + BOTTOM_NAV_MARGIN + insets.bottom;
            const offset = keyboardHeight - bottomNavSpace + 8;
            searchBarTranslateY.value = withSpring(-offset, KEYBOARD_SPRING_CONFIG);
        });

        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            searchBarTranslateY.value = withSpring(0, KEYBOARD_SPRING_CONFIG);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const animatedSearchBarStyle = useAnimatedStyle(() => {
        "worklet";
        return {
            transform: [{ translateY: searchBarTranslateY.value }],
        };
    });

    // ─── Scroll to Top Trigger ────────────────────────────────────
    const trigger = useScrollStore((state) => state.triggers["search"]);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [trigger]);

    // ─── Prefetching ──────────────────────────────────────────────
    useEffect(() => {
        if (profiles && profiles.length > 0) {
            const avatarsToPreload = profiles
                .slice(0, 20)
                .filter(
                    (p): p is Profile & { avatar_url: string } => !!p.avatar_url
                )
                .map((p) => ({ uri: p.avatar_url }));

            if (avatarsToPreload.length > 0) {
                TurboImage.prefetch(avatarsToPreload);
            }
        }
    }, [profiles]);

    // ─── Refresh ──────────────────────────────────────────────────
    const handleRefresh = useCallback(async () => {
        queryClient.removeQueries({ queryKey: ["profiles"] });
        refetch();
    }, [refetch]);

    // ─── Pagination ───────────────────────────────────────────────
    const handleEndReached = useCallback(() => {
        if (hasNextPage) fetchNextPage();
    }, [hasNextPage, fetchNextPage]);

    // ─── Return ViewModel ─────────────────────────────────────────
    return {
        // State
        searchQuery,
        debouncedSearchQuery,
        isFocused,
        isAdmin,
        profiles,
        totalResults,
        isLoading: isLoading && isQueryEnabled,
        isRefetching,
        isFetchingNextPage,

        // Refs
        inputRef,
        listRef,

        // Layout
        insets,
        baseSearchBarBottom,
        contentBottomPadding,

        // Animated
        animatedSearchBarStyle,

        // Handlers
        handleSearchChange,
        clearSearch,
        handleFocus,
        handleBlur,
        handleRefresh,
        handleEndReached,
    };
};
