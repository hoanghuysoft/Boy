import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { FlexText } from '../FlexText';

interface ChannelRowProps {
  channelAvatar: string;
  channelName: string;
  colors: any;
  subscribersCount?: string;
}

export const ChannelRow = ({
  channelAvatar,
  channelName,
  colors,
  subscribersCount = "1.82M subscribers",
}: ChannelRowProps) => {
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribeToggle = () => {
    setSubscribed(prev => !prev);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.outlineVariant }]}>
      <View style={styles.leftCol}>
        {/* Channel Avatar */}
        <ExpoImage
          source={{ uri: channelAvatar }}
          style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]}
          contentFit="cover"
        />

        {/* Channel Name & Subscribers */}
        <View style={styles.textContainer}>
          <FlexText numberOfLines={1} style={[styles.channelName, { color: colors.onSurface }]}>
            {channelName}
          </FlexText>
          <Text style={[styles.subscribers, { color: colors.onSurfaceVariant }]}>
            {subscribersCount}
          </Text>
        </View>
      </View>

      {/* Subscribe Button */}
      <TouchableOpacity
        onPress={handleSubscribeToggle}
        activeOpacity={0.8}
        style={[
          styles.subscribeButton,
          subscribed
            ? { backgroundColor: colors.surfaceContainerHigh }
            : { backgroundColor: colors.onSurface }
        ]}
      >
        <Text
          style={[
            styles.subscribeText,
            subscribed
              ? { color: colors.onSurfaceVariant }
              : { color: colors.surface }
          ]}
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  subscribers: {
    fontSize: 11,
    marginTop: 1,
  },
  subscribeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
