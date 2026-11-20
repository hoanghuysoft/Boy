import { EmojiSelectorSheet } from "@/components/EmojiSelectorSheet";
import { FlexText } from "@/components/FlexText";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { CommentBlock } from "@/components/post/CommentBlock";
import { CommentInputBar } from "@/components/post/CommentInputBar";
import { LikersSheet } from "@/components/post/LikersSheet";
import { PostOptionsSheet } from "@/components/post/PostOptionsSheet";
import { PostItem } from "@/components/PostItem";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { Comment, CommentSortFilter } from "@/types/comment";
import { Post } from "@/types/post";
import { usePostDetailViewModel } from "@/viewmodels/PostDetailViewModel";
import { LegendList } from "@legendapp/list/react-native";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { router } from "expo-router";
import { Button } from "heroui-native/button";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    LayoutChangeEvent,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

interface CommentsSectionHeaderProps {
    totalComments: number;
    filterSort: CommentSortFilter;
    onSelectSort: (sort: CommentSortFilter) => void;
    colors: any;
    common: any;
    t: any;
}

const CommentsSectionHeader = React.memo(({
    totalComments,
    filterSort,
    onSelectSort,
    colors,
    common,
    t,
}: CommentsSectionHeaderProps) => {
    return (
        <View style={styles.commentsSectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <FlexText style={[common.heading, { fontSize: 18 }]}>
                    {t("post.commentsSheet.title")}
                </FlexText>
                {totalComments > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: "700" }}>
                            {totalComments}
                        </FlexText>
                    </View>
                )}
            </View>

            {/* Filter Pills */}
            <View style={[styles.filterContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
                <TouchableOpacity
                    onPress={() => onSelectSort("recent")}
                    style={[
                        styles.filterTab,
                        filterSort === "recent" && [
                            styles.filterTabActive,
                            { backgroundColor: colors.surface },
                        ],
                    ]}
                    activeOpacity={0.7}
                >
                    <FlexText
                        style={[
                            common.label,
                            {
                                fontSize: 12,
                                fontWeight: filterSort === "recent" ? "700" : "500",
                                color:
                                    filterSort === "recent"
                                        ? colors.onSurface
                                        : colors.onSurfaceVariant,
                            },
                        ]}
                    >
                        {t("post.commentsSheet.filterRecent", "Recent")}
                    </FlexText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onSelectSort("most_liked")}
                    style={[
                        styles.filterTab,
                        filterSort === "most_liked" && [
                            styles.filterTabActive,
                            { backgroundColor: colors.surface },
                        ],
                    ]}
                    activeOpacity={0.7}
                >
                    <FlexText
                        style={[
                            common.label,
                            {
                                fontSize: 12,
                                fontWeight: filterSort === "most_liked" ? "700" : "500",
                                color:
                                    filterSort === "most_liked"
                                        ? colors.onSurface
                                        : colors.onSurfaceVariant,
                            },
                        ]}
                    >
                        {t("post.commentsSheet.filterLiked", "Top")}
                    </FlexText>
                </TouchableOpacity>
            </View>
        </View>
    );
}, (prev, next) => {
    return (
        prev.totalComments === next.totalComments &&
        prev.filterSort === next.filterSort &&
        prev.colors === next.colors &&
        prev.common === next.common
    );
});
CommentsSectionHeader.displayName = "CommentsSectionHeader";

interface PostDetailHeaderProps {
    post: Post;
    colors: any;
    common: any;
    totalComments: number;
    filterSort: CommentSortFilter;
    onSelectSort: (sort: CommentSortFilter) => void;
    onOptionsPress: (p?: Post) => void;
    onLikeCountPress: (p: Post) => void;
    onCommentPress: () => void;
    onLayout?: (e: LayoutChangeEvent) => void;
    t: any;
}

const PostDetailHeader = React.memo(({
    post,
    colors,
    common,
    totalComments,
    filterSort,
    onSelectSort,
    onOptionsPress,
    onLikeCountPress,
    onCommentPress,
    onLayout,
    t,
}: PostDetailHeaderProps) => {
    return (
        <View onLayout={onLayout} style={{ paddingBottom: 4 }}>
            {/* Main Post - Full-bleed media support */}
            <PostItem
                post={post}
                isDetail={true}
                onOptionsPress={onOptionsPress}
                onLikeCountPress={onLikeCountPress}
                onCommentPress={onCommentPress}
            />

            {/* Section Separator & Comments Header */}
            <View style={[styles.sectionDivider, { borderColor: colors.outlineVariant }]} />

            <CommentsSectionHeader
                totalComments={totalComments}
                filterSort={filterSort}
                onSelectSort={onSelectSort}
                colors={colors}
                common={common}
                t={t}
            />
        </View>
    );
}, (prev, next) => {
    return (
        prev.post === next.post &&
        prev.colors === next.colors &&
        prev.common === next.common &&
        prev.totalComments === next.totalComments &&
        prev.filterSort === next.filterSort &&
        prev.onOptionsPress === next.onOptionsPress &&
        prev.onLikeCountPress === next.onLikeCountPress &&
        prev.onCommentPress === next.onCommentPress
    );
});
PostDetailHeader.displayName = "PostDetailHeader";

interface PostDetailScreenProps {
    postId: string;
}

export const PostDetailScreen = ({ postId }: PostDetailScreenProps) => {
    const { t } = useTranslation();
    const vm = usePostDetailViewModel(postId);
    const { commentsVm } = vm;

    const renderCommentItem = useCallback(
        ({ item }: { item: Comment }) => (
            <View style={styles.commentItemWrapper}>
                <CommentBlock item={item} vm={commentsVm} t={t} />
            </View>
        ),
        [commentsVm, t]
    );

    const listFooterElement = commentsVm.isFetchingNextPage ? (
        <View style={styles.commentItemWrapper}>
            <ShimmerGroup isLoading>
                <View style={[styles.footerLoader, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
                    <Shimmer style={{ width: 38, height: 38, borderRadius: 19 }} />
                    <View style={{ flex: 1, gap: 6 }}>
                        <Shimmer style={{ width: "55%", height: 12, borderRadius: 6 }} />
                        <Shimmer style={{ width: "80%", height: 10, borderRadius: 6 }} />
                    </View>
                </View>
            </ShimmerGroup>
        </View>
    ) : (
        <View style={{ height: 24 }} />
    );

    const listEmptyElement = commentsVm.isLoading ? (
        <View style={[styles.commentItemWrapper, { paddingTop: 16 }]}>
            {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerGroup key={i} isLoading>
                    <View style={{ flexDirection: "row", marginBottom: 20, gap: 12 }}>
                        <Shimmer style={{ width: 38, height: 38, borderRadius: 19 }} />
                        <View style={{ flex: 1, gap: 6 }}>
                            <Shimmer style={{ width: "40%", height: 12, borderRadius: 6 }} />
                            <Shimmer style={{ width: "100%", height: 44, borderRadius: 8 }} />
                            <Shimmer style={{ width: "20%", height: 10, borderRadius: 6 }} />
                        </View>
                    </View>
                </ShimmerGroup>
            ))}
        </View>
    ) : (
        <View style={styles.emptyCommentsContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: vm.colors.surfaceContainerHigh }]}>
                <MaterialIcons name="comment" size={32} color={vm.colors.onSurfaceVariant} />
            </View>
            <FlexText style={[vm.common.heading, { fontSize: 17, marginTop: 14, marginBottom: 6 }]}>
                {t("post.commentsSheet.emptyTitle")}
            </FlexText>
            <FlexText
                style={[
                    vm.common.body,
                    { color: vm.colors.onSurfaceVariant, textAlign: "center", fontSize: 13 },
                ]}
            >
                {t("post.commentsSheet.emptyBody")}
            </FlexText>
        </View>
    );

    const listHeaderElement = vm.post ? (
        <PostDetailHeader
            post={vm.post}
            colors={vm.colors}
            common={vm.common}
            totalComments={commentsVm.totalComments}
            filterSort={commentsVm.filterSort}
            onSelectSort={commentsVm.setFilterSort}
            onOptionsPress={vm.handleOptionsPress}
            onLikeCountPress={vm.handleLikeCountPress}
            onCommentPress={vm.handleCommentIconPress}
            onLayout={vm.onHeaderLayout}
            t={t}
        />
    ) : null;

    return (
        <View style={[styles.container, { backgroundColor: vm.colors.surface }]}>
            {/* Transparent Floating Navigation Bar */}
            <View
                style={[
                    styles.navHeader,
                    {
                        top: vm.insets.top + 8,
                    },
                ]}
                pointerEvents="box-none"
            >
                <TouchableOpacity
                    hitSlop={10}
                    activeOpacity={0.7}
                    onPress={() => router.back()}
                    style={[styles.headerButton, { backgroundColor: vm.colors.surfaceContainerHigh }]}
                >
                    <Ionicons name="chevron-back" size={22} color={vm.colors.onSurface} />
                </TouchableOpacity>

                {vm.post ? (
                    <TouchableOpacity
                        hitSlop={10}
                        activeOpacity={0.7}
                        onPress={() => vm.handleOptionsPress(vm.post)}
                        style={[styles.headerButton, { backgroundColor: vm.colors.surfaceContainerHigh }]}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={vm.colors.onSurface} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 38 }} />
                )}
            </View>

            {/* Post Loading Skeleton */}
            {vm.isPostLoading && !vm.post && (
                <View style={{ padding: 16, paddingTop: vm.insets.top + 56 }}>
                    <ShimmerGroup isLoading>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                            <Shimmer style={{ width: 40, height: 40, borderRadius: 20 }} />
                            <View style={{ flex: 1, gap: 6 }}>
                                <Shimmer style={{ width: "45%", height: 14, borderRadius: 6 }} />
                                <Shimmer style={{ width: "25%", height: 10, borderRadius: 6 }} />
                            </View>
                        </View>
                        <Shimmer style={{ width: "90%", height: 16, borderRadius: 6, marginBottom: 8 }} />
                        <Shimmer style={{ width: "70%", height: 16, borderRadius: 6, marginBottom: 16 }} />
                        <Shimmer style={{ width: "100%", height: 260, borderRadius: 16 }} />
                    </ShimmerGroup>
                </View>
            )}

            {/* Post Error State */}
            {vm.postError && !vm.post && (
                <View style={[styles.errorContainer, { paddingTop: vm.insets.top + 56 }]}>
                    <Ionicons name="alert-circle-outline" size={48} color={vm.colors.error} />
                    <FlexText style={[vm.common.heading, { fontSize: 18, marginTop: 12 }]}>
                        {t("post.dialogs.errorTitle", "Error")}
                    </FlexText>
                    <FlexText
                        style={[
                            vm.common.body,
                            { color: vm.colors.onSurfaceVariant, textAlign: "center", marginTop: 6 },
                        ]}
                    >
                        {t("post.loadError", "Post could not be loaded or does not exist.")}
                    </FlexText>
                    <Button variant="primary" onPress={() => vm.refetchPost()} style={{ marginTop: 16 }}>
                        {t("summary.retry", "Retry")}
                    </Button>
                </View>
            )}

            {/* Main Scrollable Content: Post + Comments + Docked Input */}
            {vm.post && (
                <View style={{ flex: 1 }}>
                    <LegendList
                        ref={vm.flatListRef}
                        data={commentsVm.comments}
                        extraData={commentsVm.expandedCommentIds}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCommentItem}
                        ListHeaderComponent={listHeaderElement}
                        ListEmptyComponent={listEmptyElement}
                        ListFooterComponent={listFooterElement}
                        onEndReached={commentsVm.handleEndReached}
                        onEndReachedThreshold={0.5}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        automaticallyAdjustKeyboardInsets={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContent,
                            {
                                paddingTop: vm.insets.top + 54,
                                paddingBottom: vm.insets.bottom + 90,
                            },
                        ]}
                        recycleItems
                    />

                    {/* Isolated Docked Comment Input Bar */}
                    <CommentInputBar
                        vm={commentsVm}
                        colors={vm.colors}
                        common={vm.common}
                        theme={vm.theme}
                        insets={vm.insets}
                        inputRef={vm.inputRef}
                        emojiSheetRef={vm.emojiSheetRef}
                    />
                </View>
            )}

            {/* Sheets and Modals */}
            <PostOptionsSheet
                ref={vm.optionsSheetRef}
                post={vm.post || null}
                currentProfileId={vm.myProfile?.id || null}
                onDeleted={vm.handlePostDeleted}
            />

            <LikersSheet
                ref={vm.likersSheetRef}
                postId={vm.selectedLikePostId}
                onDismiss={vm.handleLikersSheetDismiss}
            />

            <EmojiSelectorSheet
                ref={vm.emojiSheetRef}
                theme={vm.theme}
                colors={vm.colors}
                onSelect={(emoji) => {
                    commentsVm.setSelectedImageUrl(emoji);
                    vm.emojiSheetRef.current?.dismiss();
                }}
                onDismiss={() => {
                    vm.inputRef.current?.focus();
                }}
            />

            <GalleryModal />
        </View>
    );
};

export default PostDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navHeader: {
        position: "absolute",
        left: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 100,
    },
    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 16,
    },
    commentItemWrapper: {
        paddingHorizontal: 16,
    },
    sectionDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginTop: 4,
        marginBottom: 16,
        marginHorizontal: 16,
    },
    commentsSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    filterContainer: {
        flexDirection: "row",
        borderRadius: 20,
        padding: 3,
        alignItems: "center",
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    filterTabActive: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: "center",
    },
    emptyCommentsContainer: {
        paddingVertical: 36,
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
});
