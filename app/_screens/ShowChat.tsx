import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { useChatInfiniteQuery } from "@/services/shows";
import { createCommonStyles } from "@/styles/common";
import type { ChatMessage } from "@/types/shows";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import dayjs from "dayjs";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { flatMap } from "lodash";
import { memo, useCallback, useMemo, useRef } from "react";
import { Dimensions, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const ChatItem = memo(({
    item,
    olderItem,
    colors
}: {
    item: ChatMessage,
    olderItem: ChatMessage | undefined,
    colors: any
}) => {
    let showDateDivider = false;
    let dateString = '';

    if (!olderItem) {
        showDateDivider = true;
    } else {
        const currentDay = dayjs(item.time * 1000).startOf('day');
        const olderDay = dayjs(olderItem.time * 1000).startOf('day');
        if (!currentDay.isSame(olderDay)) {
            showDateDivider = true;
        }
    }

    if (showDateDivider) {
        const today = dayjs().startOf('day');
        const itemDay = dayjs(item.time * 1000).startOf('day');
        const isVi = dayjs.locale() === 'vi';
        if (itemDay.isSame(today)) {
            dateString = isVi ? 'Hôm nay' : 'Today';
        } else if (itemDay.isSame(today.subtract(1, 'day'))) {
            dateString = isVi ? 'Hôm qua' : 'Yesterday';
        } else {
            dateString = isVi ? itemDay.format('DD/MM/YYYY') : itemDay.format('MMMM D, YYYY');
        }
    }

    const bubbleColor = colors.card;

    const parsePatterns = useMemo(() => [
        {
            pattern: /\B@\w+/,
            style: { color: colors.secondary, fontWeight: 'bold' } as const,
        }
    ], [colors.secondary]);

    return (
        <View>
            {showDateDivider && (
                <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                    <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={16} style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 6 }}>
                        <FlexText style={{ fontSize: 12, color: colors.text, fontWeight: 'bold' }}>{dateString}</FlexText>
                    </SquircleView>
                </View>
            )}
            {/* Name and Time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 60, paddingRight: 16 }}>
                <FlexText style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{item.name}</FlexText>
                {item.is_admin && (
                    <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 6 }}>
                        <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>ADMIN</Text>
                    </View>
                )}
                <FlexText style={{ fontSize: 12, color: colors.text, marginLeft: 8, opacity: 0.6 }}>
                    {dayjs(item.time * 1000).format('HH:mm')}
                </FlexText>
            </View>

            {/* Avatar and Content */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 24, alignItems: 'flex-start', gap: 4 }}>
                <SquircleView preserveSmoothing cornerSmoothing={100} borderRadius={2} style={{ width: 36, height: 36, overflow: "hidden" }}>
                    <ExpoImage
                        source={{ uri: item.avatar_url || `https://i.pravatar.cc/100?u=${item.uid}` }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                    />
                </SquircleView>
                <View style={{ flex: 1, marginLeft: 8, alignItems: 'flex-start' }}>
                    <View style={{ maxWidth: width * 0.75 }}>
                        <View
                            style={{
                                position: 'absolute',
                                left: -7,
                                top: 12,
                                width: 0,
                                height: 0,
                                borderTopWidth: 7,
                                borderBottomWidth: 7,
                                borderRightWidth: 9,
                                borderTopColor: 'transparent',
                                borderBottomColor: 'transparent',
                                borderRightColor: bubbleColor,
                            }}
                        />
                        <View
                            style={{
                                backgroundColor: bubbleColor,
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderTopLeftRadius: 4,
                                borderTopRightRadius: 5,
                                borderBottomLeftRadius: 5,
                                borderBottomRightRadius: 5,
                            }}
                        >
                            <FlexText parse={parsePatterns} style={{ fontSize: 16, color: colors.text, lineHeight: 22 }}>{item.body}</FlexText>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id &&
        prevProps.olderItem?.id === nextProps.olderItem?.id &&
        prevProps.colors.card === nextProps.colors.card &&
        prevProps.colors.secondary === nextProps.colors.secondary;
});

ChatItem.displayName = "ChatItem";

const ShowChatScreen = () => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const blurTargetRef = useRef<View | null>(null);

    const {
        data,
        isLoading,
        isFetching,
        refetch,
        fetchNextPage,
        hasNextPage
    } = useChatInfiniteQuery();

    const items = useMemo<ChatMessage[]>(
        () => flatMap(data?.pages, (p) => [...p.messages].reverse()),
        [data]
    );

    const renderItem = useCallback(({ item, index }: { item: ChatMessage, index: number }) => {
        const olderItem = items[index + 1];

        return (
            <ChatItem
                item={item}
                olderItem={olderItem}
                colors={colors}
            />
        );
    }, [items, colors]);

    if (isLoading) {
        return (
            <View style={[common.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <FlexText style={{ color: colors.text }}>Loading chat archive...</FlexText>
            </View>
        );
    }

    return (
        <View style={[common.screen, { backgroundColor: colors.background }]}>
            <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                <FlatList
                    data={items}
                    inverted
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    ListFooterComponent={<View style={{ height: insets.top + 60 }} />}
                    onEndReached={() => {
                        if (hasNextPage && !isFetching) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            tintColor={colors.text}
                            colors={[colors.text]}
                            progressBackgroundColor={colors.card}
                        />
                    }
                />
            </BlurTargetView>
            <View style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
                <BlurView
                    tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
                    intensity={80}
                    blurTarget={blurTargetRef}
                    blurMethod="dimezisBlurViewSdk31Plus"
                    style={{
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginRight: 8,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <Ionicons name='chevron-back' size={24} color={colors.onSurface} />
                    </TouchableOpacity>
                </BlurView>

                <BlurView
                    tint={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
                    intensity={80}
                    blurTarget={blurTargetRef}
                    blurMethod="dimezisBlurViewSdk31Plus"
                    style={{
                        borderRadius: 999,
                        overflow: 'hidden',
                    }}
                >
                    <View style={{ paddingHorizontal: 16, height: 40, justifyContent: 'center' }}>
                        <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                            Chat Archive
                        </FlexText>
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

export default ShowChatScreen;
