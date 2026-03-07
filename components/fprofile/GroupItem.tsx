import { FBGroup } from '@/types/localfb';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { memo } from 'react';
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import CachedImage from './CachedImage';

dayjs.extend(relativeTime);

const formatTimeAgo = (timestamp: number): string | null => {
    if (!timestamp || timestamp === 0) return null;
    return dayjs(timestamp).fromNow();
};

const GroupItem: React.FC<{
    group: FBGroup;
    fbColors: any;
    formatCount: (count: number) => string;
}> = ({ group, fbColors, formatCount }) => {
    const visibilityIcon =
        group.visibility === 'OPEN'
            ? 'globe-outline'
            : group.visibility === 'CLOSED'
                ? 'lock-closed-outline'
                : 'eye-off-outline';

    return (
        <TouchableOpacity
            style={[styles.groupItem, { borderBottomColor: fbColors.divider }]}
            activeOpacity={0.8}
            onPress={() => {
                if (group.url) Linking.openURL(group.url);
            }}
        >
            <CachedImage
                uri={group.image}
                style={styles.groupImage}
                resizeMode="cover"
            />
            <View style={styles.groupInfo}>
                <Text
                    style={[styles.groupName, { color: fbColors.primaryText }]}
                    numberOfLines={2}
                >
                    {group.name}
                </Text>
                <View style={styles.groupMeta}>
                    <Ionicons name={visibilityIcon as any} size={12} color={fbColors.secondaryText} />
                    <Text style={[styles.groupMetaText, { color: fbColors.secondaryText }]}>
                        {group.visibility.charAt(0) + group.visibility.slice(1).toLowerCase()}
                    </Text>
                    <Text style={[styles.groupDot, { color: fbColors.secondaryText }]}> · </Text>
                    <Text style={[styles.groupMetaText, { color: fbColors.secondaryText }]}>
                        {formatCount(group.membersCount)} members
                    </Text>
                </View>
                {group.addedTime > 0 && (
                    <View style={styles.groupMeta}>
                        <Ionicons name="time-outline" size={12} color={fbColors.secondaryText} />
                        <Text style={[styles.groupMetaText, { color: fbColors.secondaryText }]}>
                            Joined {formatTimeAgo(group.addedTime)}
                        </Text>
                    </View>
                )}
                {group.description && (
                    <Text
                        style={[styles.groupDesc, { color: fbColors.secondaryText }]}
                        numberOfLines={2}
                    >
                        {group.description}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={fbColors.secondaryText} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    groupImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
    },
    groupMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 4,
    },
    groupMetaText: {
        fontSize: 12,
    },
    groupDot: {
        fontSize: 12,
    },
    groupDesc: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: 3,
    },
});

export const MemoGroupItem = memo(GroupItem);
export default GroupItem;
