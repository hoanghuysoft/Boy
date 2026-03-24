import { useCarouselColorStore } from "@/stores/carouselColor";
import { useSettingsStore } from "@/stores/settings";
import { Post } from "@/types/post";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useProfile } from "../services/userprofile";
import { createCommonStyles } from "../styles/common";

const HEADER_HEIGHT = 75;
const TABS_HEIGHT = 50;
const SCROLL_THRESHOLD = 10;

export const useHomeViewModel = () => {
  const router = useRouter();
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();

  // ─── Current User Profile ──────────────────────────────────────
  const { data: myProfile } = useProfile("me", true);

  // ─── Post Options Sheet ────────────────────────────────────────
  const optionsSheetRef = useRef<TrueSheet>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // ─── Likers Sheet ───────────────────────────────────────────────
  const likersSheetRef = useRef<TrueSheet>(null);
  const [selectedLikePostId, setSelectedLikePostId] = useState<string | null>(
    null,
  );

  // ─── Comments Sheet ─────────────────────────────────────────────
  const commentsSheetRef = useRef<TrueSheet>(null);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<
    string | null
  >(null);

  // ─── Carousel Color Store ──────────────────────────────────────
  const { overlayColor, isUsingCarouselColor } = useCarouselColorStore();

  // ─── Carousel Settings ─────────────────────────────────────────
  const { showCarousel: carouselEnabled } = useSettingsStore();
  const isCarouselVisible = useRef(true);
  const carouselVisibility = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // ─── Carousel Color Tracking ───────────────────────────────────
  const [useCarouselColor, setUseCarouselColor] = useState(false);

  useEffect(() => {
    const listenerId = carouselVisibility.addListener(({ value }) => {
      const shouldShow = value > 0.5;
      setUseCarouselColor(
        shouldShow && carouselEnabled && isUsingCarouselColor,
      );
    });

    return () => {
      carouselVisibility.removeListener(listenerId);
    };
  }, [carouselVisibility, carouselEnabled, isUsingCarouselColor]);

  useEffect(() => {
    if (isCarouselVisible.current && carouselEnabled && isUsingCarouselColor) {
      setUseCarouselColor(true);
    }
  }, [isUsingCarouselColor, carouselEnabled]);

  // ─── Icon Color ────────────────────────────────────────────────
  const iconColor = useMemo(() => {
    if (useCarouselColor) {
      return overlayColor === "#000000" ? "#000000" : "#FFFFFF";
    }
    return colors.text;
  }, [useCarouselColor, overlayColor, colors.text]);

  // ─── Scroll Animation ──────────────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabVisibility = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const isTabVisible = useRef(true);

  const tabOpacity = tabVisibility;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerPillVisibility = tabVisibility;

  const pillBgOpacity = carouselVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const pillBgColor = useMemo(() => colors.tabBar + "E6", [theme]);

  // ─── Layout Constants ──────────────────────────────────────────
  const totalHeaderHeight = HEADER_HEIGHT + TABS_HEIGHT;

  // ─── Handlers ──────────────────────────────────────────────────
  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const openSettingsPage = useCallback(() => {
    router.navigate("/settings");
  }, []);

  const onScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        if (diff > 0 && isTabVisible.current && currentScrollY > 50) {
          isTabVisible.current = false;
          Animated.spring(tabVisibility, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else if (diff < 0 && !isTabVisible.current) {
          isTabVisible.current = true;
          Animated.spring(tabVisibility, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }

        lastScrollY.current = currentScrollY;
      }

      const shouldShowCarousel = currentScrollY <= 10;
      if (shouldShowCarousel !== isCarouselVisible.current) {
        isCarouselVisible.current = shouldShowCarousel;
        Animated.spring(carouselVisibility, {
          toValue: shouldShowCarousel ? 1 : 0,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }).start();

        setUseCarouselColor(
          shouldShowCarousel && carouselEnabled && isUsingCarouselColor,
        );
      }
    },
    [carouselEnabled, isUsingCarouselColor],
  );

  const handlePostOptionsPress = useCallback((post: Post) => {
    setSelectedPost(post);
    optionsSheetRef.current?.present();
  }, []);

  const handlePostDeleted = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleLikeCountPress = useCallback((post: Post) => {
    setSelectedLikePostId(post.id);
    likersSheetRef.current?.present();
  }, []);

  const handleCommentPress = useCallback((post: Post) => {
    setSelectedCommentPostId(post.id);
    commentsSheetRef.current?.present();
  }, []);

  const handleTabStateChange = useCallback(() => {
    if (!isTabVisible.current) {
      isTabVisible.current = true;
      Animated.spring(tabVisibility, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
    lastScrollY.current = 0;
  }, []);

  const navigateToSearch = useCallback(() => {
    router.push("/search");
  }, [router]);

  const navigateToBookmarks = useCallback(() => {
    router.push("/bookmarks");
  }, [router]);

  const navigateToCreate = useCallback(() => {
    router.push("/create");
  }, [router]);

  // ─── Return ViewModel ──────────────────────────────────────────
  return {
    // Theme & Layout
    colors,
    typography,
    theme,
    common,
    insets,
    headerHeight: HEADER_HEIGHT,
    tabsHeight: TABS_HEIGHT,
    totalHeaderHeight,

    // Profile
    myProfile,

    // Post Options
    optionsSheetRef,
    selectedPost,

    // Likers Sheet
    likersSheetRef,
    selectedLikePostId,

    // Comments Sheet
    commentsSheetRef,
    selectedCommentPostId,

    // Carousel
    carouselEnabled,
    carouselVisibility,

    // Modal
    modalVisible,
    setModalVisible,

    // Colors
    iconColor,

    // Animations
    headerBgOpacity,
    headerPillVisibility,
    tabOpacity,
    pillBgOpacity,
    pillBgColor,

    // Handlers
    openModal,
    openSettingsPage,
    onScroll,
    handlePostOptionsPress,
    handlePostDeleted,
    handleLikeCountPress,
    handleCommentPress,
    handleTabStateChange,
    navigateToSearch,
    navigateToBookmarks,
    navigateToCreate,
  };
};
