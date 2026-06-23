import type { IComment } from '@/services/shows';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import { Image as ExpoImage } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlexText } from '../FlexText';

interface CommentItemProps {
  comment: IComment;
  colors: any;
}

export const CommentItem = ({ comment, colors }: CommentItemProps) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const formattedUsername = `@${comment.userName.toLowerCase().replace(/\s+/g, '')}`;

  const likesCount = parseInt(comment.likes) || 0;
  const displayLikes = liked ? likesCount + 1 : likesCount;

  const handleLike = () => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setDisliked(false);
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      setLiked(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* User Avatar */}
      <ExpoImage
        source={{ uri: comment.avatarUrl }}
        style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]}
        contentFit="cover"
      />

      {/* Comment Details */}
      <View style={styles.content}>
        {/* Username & Time ago */}
        <View style={styles.header}>
          <FlexText style={[styles.username, { color: colors.onSurface }]}>
            {formattedUsername}
          </FlexText>
          <FlexText style={[styles.timeAgo, { color: colors.onSurfaceVariant }]}>
            {comment.timeAgo}
          </FlexText>
        </View>

        {/* Comment Text */}
        <FlexText style={[styles.commentText, { color: colors.onSurface }]}>
          {comment.commentText}
        </FlexText>

        {/* Action Row: Like, Dislike, Heart, Reply */}
        <View style={styles.actionRow}>
          {/* Like */}
          <TouchableOpacity onPress={handleLike} style={styles.actionButton} activeOpacity={0.7}>
            <MaterialIcons
              name={liked ? "thumb-up" : "thumb-up-off-alt"}
              size={14}
              color={liked ? colors.primary : colors.onSurfaceVariant}
            />
            {displayLikes > 0 && (
              <Text style={[styles.actionText, { color: colors.onSurfaceVariant }]}>
                {displayLikes}
              </Text>
            )}
          </TouchableOpacity>

          {/* Dislike */}
          <TouchableOpacity onPress={handleDislike} style={styles.actionButton} activeOpacity={0.7}>
            <MaterialIcons
              name={disliked ? "thumb-down" : "thumb-down-off-alt"}
              size={14}
              color={disliked ? colors.error : colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {/* Creator Heart badge (YouTube style creator favorited) */}
          {likesCount > 50 && (
            <View style={styles.creatorHeartContainer}>
              <View style={[styles.creatorAvatarWrapper, { borderColor: colors.primary }]}>
                <ExpoImage
                  source={{ uri: "https://api.dicebear.com/7.x/adventurer/svg?seed=creator" }}
                  style={styles.creatorAvatar}
                />
              </View>
              <View style={[styles.heartBadge, { backgroundColor: colors.error }]}>
                <MaterialIcons name="favorite" size={8} color="#fff" />
              </View>
            </View>
          )}

          {/* Reply */}
          <TouchableOpacity style={styles.replyButton} activeOpacity={0.7}>
            <Text style={[styles.replyText, { color: colors.onSurfaceVariant }]}>
              Reply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  replyButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  replyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  creatorHeartContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatarWrapper: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  creatorAvatar: {
    width: '100%',
    height: '100%',
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
