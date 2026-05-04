import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { useBulletinboard } from "@/services/bulletinboard";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { MediaViewer } from 'expo-media-viewer';
import { Stack, router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { useRef } from "react";
import { Dimensions, FlatList, RefreshControl, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const Bulletinboard = () => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const blurTargetRef = useRef(null);
    const { data: bulletinData, isLoading, isFetching, refetch } = useBulletinboard();

    // We assume the first item's author is the channel owner
    const ownerInfo = bulletinData?.item_list?.[0]?.publish_user;

    const renderTextMessage = (text: string) => {
        const bubbleColor = colors.card;

        return (
            <View style={{ maxWidth: width * 0.75, marginLeft: 6 }}>
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
                    <FlexText style={{ fontSize: 16, color: colors.text, lineHeight: 22 }}>{text}</FlexText>
                </View>
            </View>
        );
    };

    const renderPoll = (poll: any) => {
        return (
            <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={20} style={{ backgroundColor: colors.card, padding: 16, width: width * 0.75 }}>
                <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>{poll.title}</FlexText>
                {poll.options.map((opt: any, i: number) => {
                    const percentage = poll.total_voted_count > 0 ? (opt.voted_count / poll.total_voted_count) * 100 : 0;
                    return (
                        <View key={i} style={{ marginBottom: 12 }}>
                            <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={12} style={{ height: 40, backgroundColor: colors.background, overflow: 'hidden', justifyContent: 'center' }}>
                                <View style={{ position: 'absolute', width: `${percentage}%`, height: '100%', backgroundColor: colors.containerContent }} />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, width: '100%' }}>
                                    <FlexText style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>{opt.content}</FlexText>
                                    <FlexText style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>{percentage.toFixed(0)}%</FlexText>
                                </View>
                            </SquircleView>
                        </View>
                    )
                })}
                <FlexText style={{ fontSize: 13, color: colors.text, textAlign: 'center', marginTop: 4 }}>
                    {poll.total_voted_count} votes • {poll.poll_expired ? 'Ended' : 'Active'}
                </FlexText>
            </SquircleView>
        )
    }

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isText = item.type === 1 && item.text;
        const isImage = item.type === 3 && item.images;
        const isPoll = item.type === 8 && item.poll;
        const reactions = item.emoji_list || [];

        const olderItem = bulletinData?.item_list?.[index + 1];
        let showDateDivider = false;
        let dateString = '';

        if (!olderItem) {
            showDateDivider = true;
        } else {
            const currentDay = dayjs(item.create_time).startOf('day');
            const olderDay = dayjs(olderItem.create_time).startOf('day');
            if (!currentDay.isSame(olderDay)) {
                showDateDivider = true;
            }
        }

        if (showDateDivider) {
            const today = dayjs(bulletinData?.current_timestamp ?? Date.now()).startOf('day');
            const itemDay = dayjs(item.create_time).startOf('day');
            if (itemDay.isSame(today)) {
                dateString = 'Today';
            } else if (itemDay.isSame(today.subtract(1, 'day'))) {
                dateString = 'Yesterday';
            } else {
                dateString = itemDay.format('MMMM D, YYYY');
            }
        }

        return (
            <View>
                {showDateDivider && (
                    <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                        <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={16} style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 6 }}>
                            <FlexText style={{ fontSize: 12, color: colors.text, fontWeight: 'bold' }}>{dateString}</FlexText>
                        </SquircleView>
                    </View>
                )}
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 24, alignItems: 'flex-end' }}>
                    <Image
                        source={{ uri: item.publish_user?.avatar_thumb?.url_list?.[0] }}
                        style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, marginBottom: reactions.length > 0 ? 16 : 0 }}
                    />
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <FlexText style={{ fontSize: 13, color: colors.text, marginLeft: 4, fontWeight: '600' }}>{item.publish_user?.nickname}</FlexText>
                            <FlexText style={{ fontSize: 12, color: colors.text, marginLeft: 8 }}>
                                {dayjs(item.create_time).format('HH:mm')}
                            </FlexText>
                        </View>

                        {isText && (
                            renderTextMessage(item.text)
                        )}

                        {isImage && item.images[0]?.origin_url?.url_list?.[0] && (
                            <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={20} style={{ overflow: 'hidden' }}>
                                <MediaViewer
                                    urls={[item.images[0].origin_url.url_list[0]]}
                                    mediaTypes={["image"]}
                                    theme="dark"
                                >
                                    <MediaViewer.Image index={0} edgeToEdge={true}>
                                        <Image
                                            source={{ uri: item.images[0].origin_url.url_list[0] }}
                                            style={{ width: width * 0.7, height: (width * 0.7) * 1.3 }}
                                            contentFit="cover"
                                        />
                                    </MediaViewer.Image>
                                </MediaViewer>
                            </SquircleView>
                        )}

                        {isPoll && renderPoll(item.poll)}

                        {reactions.length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 4 }}>
                                {reactions.map((r: any, i: number) => (
                                    <SquircleView cornerSmoothing={100} preserveSmoothing borderRadius={16} key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4 }}>
                                        <FlexText style={{ fontSize: 13 }}>{r.emoji}</FlexText>
                                        <FlexText style={{ fontSize: 12, color: colors.text, marginLeft: 4, fontWeight: '600' }}>{r.count}</FlexText>
                                    </SquircleView>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={[common.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <FlexText style={{ color: colors.text }}>Loading channel...</FlexText>
            </View>
        );
    }

    return (
        <View style={[common.screen, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                <FlatList
                    data={bulletinData?.item_list || []}
                    inverted
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: insets.top + 60 }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={refetch}
                            tintColor={colors.secondary}
                            colors={[colors.secondary]}
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
                        <Ionicons name='chevron-back' size={24} color={colors.text} />
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
                            {ownerInfo?.nickname ? `${ownerInfo.nickname}'s Channel` : 'Broadcast Channel'}
                        </FlexText>
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

export default Bulletinboard;
