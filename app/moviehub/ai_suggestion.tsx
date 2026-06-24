/**
 * app/moviehub/ai_suggestion.tsx
 *
 * AI Video Suggestion — fully automatic, 100% offline.
 *
 * The engine reads the user's watch history, watchlist and search queries
 * to silently build an interest profile, then ranks the current feed and
 * surfaces the best picks — no text input required.
 */

import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import {
  useLatestInfiniteQuery,
  usePopularInfiniteQuery,
} from '@/services/shows';
import { getSearchQueryHistory } from '@/stores/searchQueryHistory';
import { useShowWatchlistStore } from '@/stores/showWatchlist';
import { useWatchHistoryStore } from '@/stores/watchHistory';
import { useLikedVideosStore } from '@/stores/likedVideos';
import { createCommonStyles } from '@/styles/common';
import type { VideoCard } from '@/types/shows/videoCard';
import {
  getDynamicRecommendation,
  getPersonalisedRecommendation,
  type InterestProfile,
  type RecommendationResult,
} from '@/utils/recommendation';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import { SkeletonGroup } from 'heroui-native/skeleton-group';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenPages<T extends { items: VideoCard[] }>(pages: T[] | undefined): VideoCard[] {
  if (!pages) return [];
  const seen = new Set<string>();
  return pages.flatMap(p =>
    p.items.filter(item => {
      if (!item.video_url || seen.has(item.video_url)) return false;
      seen.add(item.video_url);
      return true;
    })
  );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

interface HeroCardProps {
  result: RecommendationResult;
  thumbHeight: number;
  colors: ReturnType<typeof useThemeContext>['colors'];
  onPress: () => void;
}

function HeroCard({ result, thumbHeight, colors, onPress }: HeroCardProps) {
  return (
    <View>
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
        <SquircleView
          cornerSmoothing={60}
          preserveSmoothing
          style={[styles.heroCard, { backgroundColor: colors.surfaceContainerHigh }]}
        >
          {/* Thumbnail */}
          <View style={{ height: thumbHeight, overflow: 'hidden' }}>
            <ExpoImage
              source={{ uri: result.video.thumb_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <View style={[StyleSheet.absoluteFill, styles.heroOverlay]}>
              <View style={[styles.aiBadge, { backgroundColor: 'rgba(0,0,0,0.60)' }]}>
                <Ionicons name="sparkles" size={12} color="#FFD700" />
                <FlexText style={styles.aiBadgeText}>AI Pick</FlexText>
              </View>
              {!!result.video.duration && (
                <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                  <FlexText style={styles.durationText}>{result.video.duration}</FlexText>
                </View>
              )}
            </View>
          </View>

          {/* Info */}
          <View style={{ padding: 14, gap: 8 }}>
            <FlexText numberOfLines={2} style={[styles.heroTitle, { color: colors.onSurface }]}>
              {result.video.title}
            </FlexText>
            <FlexText numberOfLines={3} style={[styles.heroReason, { color: colors.onSurfaceVariant }]}>
              {result.reason}
            </FlexText>
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.watchBtn, { backgroundColor: colors.onSurface }]}
            >
              <Ionicons name="play" size={14} color={colors.surface} />
              <FlexText style={[styles.watchBtnText, { color: colors.surface }]}>Watch Now</FlexText>
            </TouchableOpacity>
          </View>
        </SquircleView>
      </Pressable>
    </View>
  );
}

// ─── Candidate Row ────────────────────────────────────────────────────────────

interface CandidateRowProps {
  item: RecommendationResult;
  rank: number;
  colors: ReturnType<typeof useThemeContext>['colors'];
  onPress: () => void;
}

function CandidateRow({ item, rank, colors, onPress }: CandidateRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.candidateRow,
        { backgroundColor: colors.surfaceContainerLow, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {/* Rank number */}
      <FlexText style={[styles.rankNum, { color: colors.onSurfaceVariant }]}>
        {String(rank).padStart(2, '0')}
      </FlexText>

      {/* Thumbnail */}
      <View style={styles.candidateThumb}>
        <ExpoImage
          source={{ uri: item.video.thumb_url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        {!!item.video.duration && (
          <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <FlexText style={styles.durationText}>{item.video.duration}</FlexText>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 3 }}>
        <FlexText numberOfLines={2} style={[styles.candidateTitle, { color: colors.onSurface }]}>
          {item.video.title}
        </FlexText>
        {!!item.video.views && (
          <FlexText style={[styles.candidateMeta, { color: colors.onSurfaceVariant }]}>
            {item.video.views}
          </FlexText>
        )}
      </View>

      <Ionicons name="chevron-forward" size={15} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton({ thumbHeight }: { thumbHeight: number }) {
  return (
    <SkeletonGroup isLoading>
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Hero placeholder */}
        <SkeletonGroup.Item style={{ height: thumbHeight + 120, borderRadius: 20 }} />
        {/* Row placeholders */}
        {[0, 1, 2].map(i => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <SkeletonGroup.Item style={{ width: 30, height: 16, borderRadius: 4 }} />
            <SkeletonGroup.Item style={{ width: 110, height: 70, borderRadius: 10 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonGroup.Item style={{ height: 14, width: '80%', borderRadius: 4 }} />
              <SkeletonGroup.Item style={{ height: 11, width: '50%', borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AiSuggestionScreen() {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const thumbHeight = Math.round(width * (9 / 16) * 0.65);

  // ── Feed data ─────────────────────────────────────────────────────────────
  const popular = usePopularInfiniteQuery(true);
  const latest = useLatestInfiniteQuery(true);

  const candidates = useMemo<VideoCard[]>(() => {
    const seen = new Set<string>();
    return [
      ...flattenPages(popular.data?.pages as any),
      ...flattenPages(latest.data?.pages as any),
    ].filter(v => {
      if (!v.video_url || seen.has(v.video_url)) return false;
      seen.add(v.video_url);
      return true;
    });
  }, [popular.data, latest.data]);

  const isLoading = popular.isLoading || latest.isLoading;

  // ── Interest inputs (all local, no network) ───────────────────────────────
  const watchlist = useShowWatchlistStore(s => s.watchlist);
  const watchHistory = useWatchHistoryStore(s => s.history);
  const likedStore = useLikedVideosStore();

  const watchlistTitles = useMemo(
    () => [
      ...watchlist.map(w => w.title),
      ...watchHistory.map(h => h.title),
    ],
    [watchlist, watchHistory]
  );

  const likedTitles = useMemo(
    () => likedStore.likedVideos.map(v => v.title),
    [likedStore.likedVideos]
  );

  const searchQueries = useMemo(
    () => [
      ...getSearchQueryHistory('shows'),
      ...getSearchQueryHistory('movies'),
    ],
    []
  );

  // ── Recommendation results (synchronously memoised to avoid effects/cascading renders) ──
  const { profile, topPick, morePicks } = useMemo(() => {
    if (candidates.length === 0) {
      return { profile: null, topPick: null, morePicks: [] };
    }

    const result = getPersonalisedRecommendation(candidates, watchlistTitles, searchQueries, likedTitles);
    const rest = candidates.filter(v => v.video_url !== result.video.video_url);
    const vibe = result.profile.isNewUser ? '' : result.profile.generatedVibe;

    let more: RecommendationResult[] = [];
    if (!result.profile.isNewUser && vibe) {
      more = rest
        .map((video: VideoCard) => getDynamicRecommendation([video], vibe))
        .sort((a: RecommendationResult, b: RecommendationResult) => b.score - a.score)
        .slice(0, 8);
    } else {
      // New user: show hot videos as fallback
      const hot = rest.filter(v => v.hot).slice(0, 8).map(v => ({
        video: v,
        reason: 'Trending right now',
        score: 1,
      }));
      more = hot.length ? hot : rest.slice(0, 8).map(v => ({
        video: v,
        reason: 'Popular on the platform',
        score: 0,
      }));
    }

    return {
      profile: result.profile,
      topPick: result,
      morePicks: more,
    };
  }, [candidates, watchlistTitles, searchQueries, likedTitles]);

  const navigateToVideo = useCallback((video: VideoCard) => {
    router.push({
      pathname: '/moviehub/video_detail',
      params: { video_url: video.video_url },
    });
  }, []);

  const renderMoreItem = useCallback(
    ({ item, index }: { item: RecommendationResult; index: number }) => (
      <CandidateRow
        item={item}
        rank={index + 2} // top pick is #1
        colors={colors}
        onPress={() => navigateToVideo(item.video)}
      />
    ),
    [colors, navigateToVideo]
  );

  // ── List header (everything above the candidate rows) ─────────────────────
  const ListHeader = (
    <View style={{ gap: 20, paddingBottom: 4 }}>
      {/* Title + Subtitle */}
      <View style={{ marginTop: insets.top + 66, paddingHorizontal: 16 }}>
        <FlexText style={[common.heading, { fontSize: 28, color: colors.onSurface }]}>
          For You
        </FlexText>
        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
          Personalised · 100% offline
        </FlexText>
      </View>

      {/* Skeleton */}
      {isLoading && <LoadingSkeleton thumbHeight={thumbHeight} />}

      {/* Interest profile chips */}
      {!isLoading && profile && !profile.isNewUser && (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <FlexText style={[common.bodySmall, { color: colors.muted }]}>
            Matched your interest in:
          </FlexText>
          <View style={styles.chipRow}>
            {profile.topKeywords.map(kw => (
              <SquircleView
                key={kw}
                cornerSmoothing={60}
                preserveSmoothing
                style={[styles.chip, { backgroundColor: colors.secondaryContainer }]}
              >
                <FlexText style={[styles.chipText, { color: colors.onSecondaryContainer }]}>
                  {kw}
                </FlexText>
              </SquircleView>
            ))}
          </View>
        </View>
      )}

      {/* New-user notice */}
      {!isLoading && profile?.isNewUser && (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={[styles.noticeBox, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.onSurfaceVariant} />
            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, flex: 1 }]}>
              {"Watch a few videos and we'll personalise these picks just for you!"}
            </FlexText>
          </View>
        </View>
      )}

      {/* Hero card */}
      {!isLoading && topPick && (
        <View style={{ paddingHorizontal: 16 }}>
          <HeroCard
            result={topPick}
            thumbHeight={thumbHeight}
            colors={colors}
            onPress={() => navigateToVideo(topPick.video)}
          />
        </View>
      )}

      {/* Section title for list below */}
      {!isLoading && morePicks.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <FlexText style={[common.heading, { fontSize: 16, color: colors.onSurface }]}>
            You Might Also Like
          </FlexText>
        </View>
      )}
    </View>
  );

  return (
    <View style={[common.screen, { backgroundColor: colors.background }]}>
      {/* Floating back button — same pattern as Settings/Bookmarks */}
      <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Floating AI Orb */}
      <View style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 1000 }}>
        <View
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="sparkles" size={18} color="#FFD700" />
        </View>
      </View>

      <FlatList
        data={isLoading ? [] : morePicks}
        keyExtractor={(item, i) => `${item.video.video_url}-${i}`}
        renderItem={renderMoreItem}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={
          <RefreshControl
            refreshing={popular.isRefetching || latest.isRefetching}
            onRefresh={() => {
              popular.refetch();
              latest.refetch();
            }}
            tintColor={colors.onSurface}
            colors={[colors.onSurface]}
            progressBackgroundColor={colors.surfaceContainerHigh}
            progressViewOffset={insets.top}
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Interest chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'GoogleSansFlexMedium',
  },

  // New-user notice
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },

  // Hero card
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroOverlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  aiBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'GoogleSansFlexBold',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'GoogleSansFlexMedium',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    fontFamily: 'GoogleSansFlexBold',
  },
  heroReason: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'GoogleSansFlexRegular',
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 2,
  },
  watchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GoogleSansFlexBold',
  },

  // Candidate rows
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 16,
  },
  rankNum: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'GoogleSansFlexBold',
    width: 24,
    textAlign: 'center',
    opacity: 0.4,
  },
  candidateThumb: {
    width: 110,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
  },
  candidateTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    fontFamily: 'GoogleSansFlexMedium',
  },
  candidateMeta: {
    fontSize: 12,
    fontFamily: 'GoogleSansFlexRegular',
  },
});
