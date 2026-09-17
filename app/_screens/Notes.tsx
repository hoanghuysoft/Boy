import { PostLinkPreview } from "@/components/PostLinkPreview";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "@/components/FlexText";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { useThemeContext } from "@/context/ThemeContext";
import { useDeleteNote, useNotes } from "@/services/note";
import { createCommonStyles } from "@/styles/common";
import { type Note } from "@/types/note";
import {
    extractAllLinks,
    extractFirstImage,
    parseNoteTitleAndBody,
    stripMarkdown,
} from "@/utils/noteMarkdown";

dayjs.extend(relativeTime);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MASONRY_CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

const NoteCard = React.memo(
    ({
        item,
        colors,
        common,
        deletingId,
        onPressNote,
        onEditNote,
        onDeleteNote,
        t,
    }: {
        item: Note;
        colors: any;
        common: any;
        deletingId: number | null;
        onPressNote: (id: number) => void;
        onEditNote: (note: Note) => void;
        onDeleteNote: (note: Note) => void;
        t: any;
    }) => {
        const { title } = parseNoteTitleAndBody(item.content);
        const previewText = stripMarkdown(item.content);
        const imageUrl = extractFirstImage(item.content);
        const linkUrls = extractAllLinks(item.content);
        const isDeleting = deletingId === item.id;

        return (
            <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => onPressNote(item.id)}
                style={styles.cardTouchable}
            >
                <SquircleView
                    cornerSmoothing={100}
                    preserveSmoothing
                    style={[
                        styles.noteCard,
                        {
                            backgroundColor: colors.surfaceContainer,
                            shadowColor: "#000",
                        },
                    ]}
                >
                    {/* Image Thumbnail */}
                    {imageUrl ? (
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.noteImage}
                                contentFit="cover"
                                transition={200}
                            />
                        </View>
                    ) : null}

                    {/* Note Title */}
                    {title ? (
                        <FlexText
                            numberOfLines={2}
                            style={[
                                common.heading,
                                {
                                    fontSize: 16,
                                    fontWeight: "700",
                                    marginBottom: 6,
                                    color: colors.onSurface,
                                    lineHeight: 22,
                                },
                            ]}
                        >
                            {title}
                        </FlexText>
                    ) : null}

                    {/* Note Preview Body */}
                    {previewText.length > 0 ? (
                        <FlexText
                            numberOfLines={imageUrl ? 3 : 6}
                            style={[
                                common.body,
                                {
                                    fontSize: 13.5,
                                    lineHeight: 19,
                                    color: title ? colors.onSurfaceVariant : colors.onSurface,
                                    marginBottom: linkUrls.length > 0 ? 8 : 10,
                                },
                            ]}
                        >
                            {previewText}
                        </FlexText>
                    ) : null}

                    {/* First Link Preview */}
                    {linkUrls.length > 0 && !imageUrl ? (
                        <View style={styles.linkWrapper} pointerEvents="none">
                            <PostLinkPreview
                                url={linkUrls[0]}
                                label=""
                                colors={colors}
                                cardWidth={MASONRY_CARD_WIDTH - 20}
                            />
                        </View>
                    ) : null}

                    {/* Bottom Row: Timestamp and Actions */}
                    <View style={styles.footerRow}>
                        <FlexText
                            style={{
                                color: colors.onSurfaceVariant,
                                fontSize: 11,
                                flex: 1,
                            }}
                            numberOfLines={1}
                        >
                            {dayjs(item.created_at).fromNow(true)}
                        </FlexText>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => onEditNote(item)}
                                disabled={isDeleting}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <FlexText style={{ color: colors.secondary, fontSize: 12, fontWeight: "700" }}>
                                    {t("notes.list.editAction")}
                                </FlexText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onDeleteNote(item)}
                                disabled={isDeleting}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                {isDeleting ? (
                                    <Spinner size="sm" color={colors.onSurfaceVariant} />
                                ) : (
                                    <FlexText style={{ color: "#ef4444", fontSize: 12, fontWeight: "700" }}>
                                        {t("notes.list.deleteAction")}
                                    </FlexText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </SquircleView>
            </TouchableOpacity>
        );
    }
);
NoteCard.displayName = "NoteCard";

const NotesScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // Fetch Notes
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useNotes(20);

    const notes = useMemo(() => {
        const pages = data?.pages;
        if (!pages) return [];
        return pages.flatMap((page) => page.data);
    }, [data?.pages]);

    const deleteNoteMutation = useDeleteNote();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handlePressNote = useCallback(
        (id: number) => {
            router.push(`/note/${id}`);
        },
        [router]
    );

    const handleEditNote = useCallback(
        (note: Note) => {
            router.push({
                pathname: "/create-note",
                params: { id: note.id.toString(), initialContent: note.content },
            });
        },
        [router]
    );

    const handleDeleteNote = useCallback(
        (note: Note) => {
            if (deletingId === note.id || deleteNoteMutation.isPending) return;
            setNoteToDelete(note);
            setIsDeleteDialogOpen(true);
        },
        [deleteNoteMutation, deletingId]
    );

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<Note>) => (
            <NoteCard
                item={item}
                colors={colors}
                common={common}
                deletingId={deletingId}
                onPressNote={handlePressNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                t={t}
            />
        ),
        [colors, common, deletingId, handlePressNote, handleEditNote, handleDeleteNote, t]
    );

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <Spinner size="md" color={colors.onSurface} />
                </View>
            );
        }
        return <View style={{ height: 90 }} />;
    }, [isFetchingNextPage, colors.onSurface]);

    const renderEmpty = useCallback(() => {
        if (isLoading) {
            const skeletonHeights = [160, 220, 190, 140, 180, 210];
            return (
                <View style={{ flexDirection: "row", paddingHorizontal: 4, gap: 10, paddingTop: 4 }}>
                    {[0, 1].map((col) => (
                        <View key={col} style={{ flex: 1, gap: 10 }}>
                            {skeletonHeights
                                .filter((_, i) => i % 2 === col)
                                .map((h, i) => (
                                    <SquircleView
                                        key={i}
                                        cornerSmoothing={100}
                                        style={[
                                            styles.noteCard,
                                            {
                                                margin: 0,
                                                height: h,
                                                backgroundColor: colors.surfaceContainer,
                                            },
                                        ]}
                                    >
                                        <ShimmerGroup isLoading>
                                            <Shimmer style={{ width: "70%", height: 16, borderRadius: 6, marginBottom: 10 }} />
                                            <Shimmer style={{ width: "100%", height: 12, borderRadius: 4, marginBottom: 6 }} />
                                            <Shimmer style={{ width: "85%", height: 12, borderRadius: 4, marginBottom: 6 }} />
                                            <Shimmer style={{ width: "60%", height: 12, borderRadius: 4 }} />
                                        </ShimmerGroup>
                                    </SquircleView>
                                ))}
                        </View>
                    ))}
                </View>
            );
        }
        return (
            <View style={styles.emptyState}>
                <View
                    style={[
                        styles.emptyIconContainer,
                        {
                            backgroundColor: colors.surfaceContainerHigh,
                        },
                    ]}
                >
                    <Ionicons name="document-text-outline" size={36} color={colors.onSurfaceVariant} />
                </View>
                <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8, color: colors.onSurface }]}>
                    {t("notes.list.emptyTitle")}
                </FlexText>
                <FlexText style={[common.body, { color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 22 }]}>
                    {t("notes.list.emptyDescription")}
                </FlexText>
            </View>
        );
    }, [isLoading, colors, common, t]);

    const ListHeaderComponent = useCallback(
        () => (
            <View style={{ marginTop: insets.top + 60, paddingHorizontal: 6, marginBottom: 14 }}>
                <FlexText style={[common.heading, { fontSize: 30, color: colors.onSurface }]}>
                    {t("notes.list.title")}
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4, fontSize: 14 }]}>
                    {t("notes.list.subtitle")}
                </FlexText>
            </View>
        ),
        [insets.top, common, colors.onSurface, colors.onSurfaceVariant, t]
    );

    return (
        <View style={[common.screen, { backgroundColor: colors.surface }]}>
            {/* Floating Back Button */}
            <View style={{ position: "absolute", top: insets.top + 12, left: 16, zIndex: 1000 }}>
                <SquircleView
                    cornerSmoothing={100}
                    preserveSmoothing
                    style={[
                        styles.backButtonSquircle,
                        {
                            backgroundColor: colors.surfaceContainer,
                            shadowColor: "#000",
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                    </TouchableOpacity>
                </SquircleView>
            </View>

            {/* Masonry FlashList */}
            <FlashList
                data={notes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={2}
                masonry={true}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                onRefresh={refetch}
                refreshing={isRefetching}
                contentContainerStyle={{
                    paddingHorizontal: 8,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 80,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.secondary}
                        colors={[colors.secondary]}
                        progressBackgroundColor={colors.surfaceContainer}
                        progressViewOffset={insets.top}
                    />
                }
            />

            {/* Floating Action Button (+ New Note) */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/create-note")}
                style={[
                    styles.fab,
                    {
                        backgroundColor: colors.secondary,
                        bottom: insets.bottom + 20,
                    },
                ]}
            >
                <Ionicons name="add" size={30} color="#ffffff" />
            </TouchableOpacity>

            {/* Delete Confirmation Dialog */}
            <Dialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 16, gap: 6 }}>
                            <Dialog.Title>{t("notes.list.deleteDialogTitle")}</Dialog.Title>
                            <Dialog.Description>
                                {t("notes.list.deleteDialogMessage")}
                            </Dialog.Description>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                            <Button variant="ghost" onPress={() => setIsDeleteDialogOpen(false)}>
                                {t("notes.list.cancelAction")}
                            </Button>
                            <Button
                                variant="danger"
                                onPress={() => {
                                    setIsDeleteDialogOpen(false);
                                    if (noteToDelete) {
                                        setDeletingId(noteToDelete.id);
                                        deleteNoteMutation.mutate(noteToDelete.id, {
                                            onSettled: () => setDeletingId(null),
                                        });
                                    }
                                }}
                            >
                                {t("notes.list.deleteAction")}
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
        </View>
    );
};

export default NotesScreen;

const styles = StyleSheet.create({
    cardTouchable: {
        flex: 1,
        margin: 5,
    },
    noteCard: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden",
    },
    imageWrapper: {
        marginBottom: 10,
        borderRadius: 12,
        overflow: "hidden",
    },
    noteImage: {
        height: 130,
        width: "100%",
        borderRadius: 12,
    },
    linkWrapper: {
        marginBottom: 10,
    },
    footerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    footerLoader: {
        paddingVertical: 24,
        alignItems: "center",
    },
    emptyState: {
        flex: 1,
        paddingVertical: 80,
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: "center",
        justifyContent: "center",
    },
    backButtonSquircle: {
        borderRadius: 999,
        width: 42,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    backButton: {
        width: 42,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
    },
    fab: {
        position: "absolute",
        right: 20,
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
});
