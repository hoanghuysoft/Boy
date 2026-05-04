import { Ionicons } from "@expo/vector-icons";
import { LinkPreview } from '@flyerhq/react-native-link-preview';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "../../components/FlexText";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeleteNote, useNotes } from "../../services/note";
import { createCommonStyles } from "../../styles/common";
import { Note } from "../../types/note";

dayjs.extend(relativeTime);

const IMG_PATTERN = /\[<img\s+(.*?)\s*\/>\]/gi;
const LINK_PATTERN = /\[<link\s+(.*?)\s*\/>\]/gi;

function parseNoteContent(content: string) {
    const titleMatch = content.match(/\[<title>(.*?)<\/title>\]/i);
    const title = titleMatch ? titleMatch[1] : null;

    const imgMatches = [...content.matchAll(IMG_PATTERN)];
    const imageUrl = imgMatches.length > 0 ? imgMatches[0][1] : null;

    const linkMatches = [...content.matchAll(LINK_PATTERN)];
    const linkUrls = linkMatches.map(m => m[1]);

    const text = content
        .replace(/\[<title>.*?<\/title>\]/gi, '')
        .replace(IMG_PATTERN, '')
        .replace(LINK_PATTERN, '')
        .trim();
    return { title, text, imageUrl, linkUrls };
}

const NotesScreen = () => {
    const router = useRouter();
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
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.data);
    }, [data?.pages]);

    const deleteNoteMutation = useDeleteNote();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleDeleteNote = useCallback((note: Note) => {
        if (deletingId === note.id || deleteNoteMutation.isPending) return;

        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setDeletingId(note.id);
                        deleteNoteMutation.mutate(note.id, {
                            onSettled: () => {
                                setDeletingId(null);
                            }
                        });
                    },
                },
            ]
        );
    }, [deleteNoteMutation, deletingId]);

    const renderItem = useCallback(({ item }: { item: Note }) => {
        const { title, text, imageUrl, linkUrls } = parseNoteContent(item.content);
        const isDeleting = deletingId === item.id;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/note/${item.id}`)}
                style={[styles.noteItem, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
            >
                {title && (
                    <FlexText style={[common.heading, { fontSize: 18, marginBottom: 8 }]}>
                        {title}
                    </FlexText>
                )}

                {text.length > 0 && (
                    <FlexText numberOfLines={3} style={[common.body, { fontSize: 15, lineHeight: 22 }]}>
                        {text}
                    </FlexText>
                )}

                {imageUrl ? (
                    <View style={{ marginTop: text.length > 0 ? 12 : 0 }}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.noteImage}
                            contentFit="cover"
                        />
                    </View>
                ) : linkUrls.length > 0 ? (
                    <View style={{ marginTop: text.length > 0 ? 12 : 0 }} pointerEvents="none">
                        <LinkPreview
                            text={linkUrls[0]}
                            renderText={() => <FlexText style={{ color: colors.muted, fontSize: 12 }} numberOfLines={2}>Open note to visit link</FlexText>}
                            renderTitle={(title) => <FlexText style={{ color: colors.text, fontWeight: 'bold', fontSize: 15 }} numberOfLines={2}>{title}</FlexText>}
                            renderDescription={(desc) => <FlexText style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={3}>{desc}</FlexText>}
                            containerStyle={{ borderRadius: 12, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}
                        />
                    </View>
                ) : null}

                <View style={[common.row, { alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }]}>
                    <FlexText style={[common.bodySmall, { color: colors.muted, fontSize: 12 }]}>
                        {dayjs(item.created_at).fromNow()}
                    </FlexText>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/create-note', params: { id: item.id } })}
                            disabled={isDeleting}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[styles.actionButton, { minWidth: 32, alignItems: 'center' }]}
                        >
                            <FlexText style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>
                                Edit
                            </FlexText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleDeleteNote(item)}
                            disabled={isDeleting}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[styles.actionButton, { minWidth: 32, alignItems: 'center' }]}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={colors.muted} style={{ transform: [{ scale: 0.8 }] }} />
                            ) : (
                                <FlexText style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>
                                    Delete
                                </FlexText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [theme, common.body, common.row, common.bodySmall, colors.muted, deletingId, handleDeleteNote]);

    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return (
                <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.text} />
                </View>
            );
        }
        return <View style={{ height: 100 }} />; // Padding for FAB
    }, [isFetchingNextPage, colors.text]);

    const renderEmpty = useCallback(() => {
        if (isLoading) {
            return (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color={colors.text} />
                </View>
            );
        }
        return (
            <View style={styles.emptyState}>
                <View
                    style={[
                        styles.emptyIconContainer,
                        {
                            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        },
                    ]}
                >
                    <Ionicons name="document-text" size={32} color={colors.muted} />
                </View>
                <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
                    No Notes Yet
                </FlexText>
                <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
                    Tap the + button to create your first note.
                </FlexText>
            </View>
        );
    }, [isLoading, colors, common, theme]);

    const ListHeaderComponent = useCallback(() => (
        <View style={{ marginTop: insets.top + 66, paddingHorizontal: 16, marginBottom: 16 }}>
            <FlexText style={[common.heading, { fontSize: 28 }]}>
                My Notes
            </FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                Your personal notes and ideas
            </FlexText>
        </View>
    ), [insets.top, common, colors.muted]);

    return (
        <View style={common.screen}>
            {/* Floating back button */}
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
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
                    notes.length === 0 ? styles.emptyContainer : undefined
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={insets.top}
                    />}
            />

            {/* Floating Action Button for Create Note */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/create-note")}
                style={[
                    styles.fab,
                    {
                        backgroundColor: colors.text,
                        bottom: insets.bottom + 20,
                    }
                ]}
            >
                <Ionicons name="add" size={32} color={colors.background} />
            </TouchableOpacity>
        </View>
    );
};

export default NotesScreen;

const styles = StyleSheet.create({
    noteItem: {
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
    },
    noteImage: {
        height: 180,
        borderRadius: 12,
        width: '100%',
    },
    actionButton: {
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
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 1000,
    },
});
