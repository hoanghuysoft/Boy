import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import VerifiedIcon from '@/icons/verified';
import type { XStoredUser } from '@/stores/xUsers';
import { formatCompactNumber } from '@/utils/formatNumber';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

dayjs.extend(relativeTime);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const GRID_GAP = 8;
export const HORIZONTAL_PADDING = 12;
export const NUM_COLUMNS = 3;
export const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface XUserCardProps {
  item: XStoredUser;
  onPress: (user: XStoredUser) => void;
  onLongPress: (user: XStoredUser) => void;
}

export const XUserCard = memo(function XUserCard({
  item,
  onPress,
  onLongPress,
}: XUserCardProps) {
  const { colors } = useThemeContext();

  const avatarUri = item.avatar_url
    ? item.avatar_url.replace(/_normal\.(jpg|jpeg|png|gif)$/i, '_200x200.$1')
    : FALLBACK_AVATAR;

  // Progressive ease gradient overlay fading from transparent at top into surfaceContainer at bottom
  const { colors: fadeColors, locations: fadeLocations } = useMemo(() => {
    return easeGradient({
      colorStops: {
        0: {
          color: 'transparent',
        },
        0.5: {
          color: colors.surfaceContainer + '40',
        },
        1: {
          color: colors.surfaceContainer,
        },
      },
      extraColorStopsPerTransition: 8,
    });
  }, [colors.surfaceContainer]);

  return (
    <View style={styles.cardContainer}>
      <Pressable
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: pressed ? colors.primary : colors.outlineVariant,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {/* Cover Banner (Half of Card) */}
        <View style={styles.cardBanner}>
          {item.banner_url ? (
            <ExpoImage
              source={{ uri: item.banner_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.primaryContainer + '80', colors.surfaceContainerHigh]}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Progressive Fade Overlay */}
          <LinearGradient
            colors={fadeColors as [string, string, ...string[]]}
            locations={fadeLocations as [number, number, ...number[]]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <ExpoImage
            source={{ uri: avatarUri }}
            style={[
              styles.avatar,
              {
                borderColor: colors.surfaceContainer,
                backgroundColor: colors.surfaceContainerHighest,
              },
            ]}
            contentFit="cover"
          />
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <VerifiedIcon size={13} backgroundColor="#1d9bf0" />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          <FlexText
            numberOfLines={1}
            style={[styles.displayName, { color: colors.onSurface }]}
          >
            {item.name || item.screen_name}
          </FlexText>

          <FlexText
            numberOfLines={1}
            style={[styles.handleText, { color: colors.onSurfaceVariant }]}
          >
            @{item.screen_name}
          </FlexText>

          {/* Followers */}
          <View style={styles.followerRow}>
            <Ionicons name="people-outline" size={11} color={colors.onSurfaceVariant} />
            <FlexText
              style={[styles.followerCount, { color: colors.onSurfaceVariant }]}
            >
              {formatCompactNumber(item.followers)}
            </FlexText>
          </View>

          {/* Import Date */}
          <FlexText
            numberOfLines={1}
            style={[styles.timeAgoText, { color: colors.outline }]}
          >
            {dayjs(item.importedAt).fromNow()}
          </FlexText>
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 8,
  },
  cardBanner: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
  },
  avatarWrapper: {
    marginTop: -32,
    position: 'relative',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 999,
    borderWidth: 2.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  infoContainer: {
    width: '100%',
    paddingHorizontal: 6,
    alignItems: 'center',
    marginTop: 4,
    gap: 1,
  },
  displayName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  handleText: {
    fontSize: 10,
    textAlign: 'center',
  },
  followerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 3,
  },
  followerCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeAgoText: {
    fontSize: 8,
    marginTop: 2,
  },
});
