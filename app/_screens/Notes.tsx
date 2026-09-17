import { PostLinkPreview } from "@/components/PostLinkPreview";
import Ionicons from "@react-native-vector-icons/ionicons/static";
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
    FlatList,
    type ListRenderItemInfo,
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

const NotesScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { colors, typography, theme } = useThemeContext();
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

    const handleDeleteNote = useCallback(
        (note: Note) => {
            if (deletingId === note.id || deleteNoteMutation.isPending) return;
            setNoteToDelete(note);
            setIsDeleteDialogOpen(true);
        },
        [deleteNoteMutation, deletingId]
    );

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<Note>) => {
            const { title } = parseNoteTitleAndBody(item.content);
            const previewText = stripMarkdown(item.content);
            const imageUrl = extractFirstImage(item.content);
            const linkUrls = extractAllLinks(item.content);
            const isDeleting = deletingId === item.id;

            return (
                <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => router.push(`/note/${item.id}`)}
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
                        {/* Note Title */}
                        {title ? (
                            <FlexText
                                numberOfLines={2}
                                style={[
                                    common.heading,
                                    { fontSize: 18, marginBottom: 6, color: colors.onSurface },
                                ]}
                            >
                                {title}
                            </FlexText>
                        ) : null}

                        {/* Note Preview Body */}
                        {previewText.length > 0 ? (
                            <FlexText
                                numberOfLines={3}
                                style={[
                                    common.body,
                                    {
                                        fontSize: 15,
                                        lineHeight: 22,
                                        color: title ? colors.onSurfaceVariant : colors.onSurface,
                                        marginBottom: imageUrl || linkUrls.length > 0 ? 12 : 0,
                                    },
                                ]}
                            >
                                {previewText}
                            </FlexText>
                        ) : null}

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
                        ) : linkUrls.length > 0 ? (
                            <View style={styles.linkWrapper} pointerEvents="none">
                                <PostLinkPreview
                                    url={linkUrls[0]}
                                    label=""
                                    colors={colors}
                                    cardWidth={Dimensions.get("window").width - 64}
                                />
                            </View>
                        ) : null}

                        {/* Bottom Row: Timestamp and Actions */}
                        <View style={[common.row, styles.footerRow]}>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                                {dayjs(item.created_at).fromNow()}
                            </FlexText>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: "/create-note", params: { id: item.id } })}
                                    disabled={isDeleting}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <FlexText style={{ color: colors.secondary, fontSize: 13, fontWeight: "700" }}>
                                        {t("notes.list.editAction")}
                                    </FlexText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleDeleteNote(item)}
                                    disabled={isDeleting}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    {isDeleting ? (
                                        <Spinner size="sm" color={colors.onSurfaceVariant} />
                                    ) : (
                                        <FlexText style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>
                                            {t("notes.list.deleteAction")}
                                        </FlexText>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SquircleView>
                </TouchableOpacity>
            );
        },
        [colors, common, deletingId, handleDeleteNote, router, t]
    );

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <Spinner size="md" color={colors.onSurface} />
                </View>
            );
        }
        return <View style={{ height: 100 }} />;
    }, [isFetchingNextPage, colors.onSurface]);

    const renderEmpty = useCallback(() => {
        if (isLoading) {
            return (
                <View style={{ paddingTop: 16 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SquircleView
                            key={i}
                            cornerSmoothing={100}
                            style={[
                                styles.noteCard,
                                {
                                    backgroundColor: colors.surfaceContainer,
                                },
                            ]}
                        >
                            <ShimmerGroup isLoading>
                                <Shimmer style={{ width: "40%", height: 20, borderRadius: 6, marginBottom: 12 }} />
                                <View style={{ gap: 8, marginBottom: 14 }}>
                                    <Shimmer style={{ width: "100%", height: 16, borderRadius: 6 }} />
                                    <Shimmer style={{ width: "85%", height: 16, borderRadius: 6 }} />
                                    <Shimmer style={{ width: "65%", height: 16, borderRadius: 6 }} />
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <Shimmer style={{ width: 64, height: 14, borderRadius: 6 }} />
                                    <View style={{ flexDirection: "row", gap: 16 }}>
                                        <Shimmer style={{ width: 40, height: 14, borderRadius: 6 }} />
                                        <Shimmer style={{ width: 48, height: 14, borderRadius: 6 }} />
                                    </View>
                                </View>
                            </ShimmerGroup>
                        </SquircleView>
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
            <View style={{ marginTop: insets.top + 60, paddingHorizontal: 4, marginBottom: 16 }}>
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

            <FlatList
                data={notes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                onRefresh={refetch}
                refreshing={isRefetching}
                contentContainerStyle={[
                    { paddingHorizontal: 16 },
                    notes.length === 0 ? styles.emptyContainer : undefined,
                ]}
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
    noteCard: {
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 14,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    imageWrapper: {
        marginTop: 6,
        marginBottom: 12,
        borderRadius: 14,
        overflow: "hidden",
    },
    noteImage: {
        height: 180,
        width: "100%",
        borderRadius: 14,
    },
    linkWrapper: {
        marginTop: 6,
        marginBottom: 12,
    },
    footerRow: {
        alignItems: "center",
        marginTop: 10,
        justifyContent: "space-between",
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
    emptyContainer: {
        flex: 1,
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
