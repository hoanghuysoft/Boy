import * as Clipboard from "expo-clipboard";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { router, useLocalSearchParams } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    EnrichedMarkdownText,
    type MarkdownStyle,
} from "react-native-enriched-markdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { useNote, useUpdateNote } from "@/services/note";
import { createCommonStyles } from "@/styles/common";
import {
    legacyToMarkdown,
    parseNoteTitleAndBody,
    toggleTaskInMarkdown,
} from "@/utils/noteMarkdown";

const NoteDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const noteId = Number(id);
    const { t } = useTranslation();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const { toast } = useToast();

    const { data, isLoading } = useNote(noteId);
    const updateNoteMutation = useUpdateNote();
    const note = data?.data;

    // Convert and normalize markdown from raw note content
    const normalizedMarkdown = useMemo(() => {
        if (!note?.content) return "";
        return legacyToMarkdown(note.content);
    }, [note?.content]);

    // Parse note title for header
    const parsedTitle = useMemo(() => {
        if (!normalizedMarkdown) return "";
        const { title } = parseNoteTitleAndBody(normalizedMarkdown);
        return title;
    }, [normalizedMarkdown]);

    // Interactive link press: open inside in-app browser
    const handleLinkPress = useCallback(({ url }: { url: string }) => {
        if (!url) return;
        router.push({
            pathname: "/inapp_browser",
            params: { url: encodeURIComponent(url) },
        });
    }, []);

    // Interactive task list toggle
    const handleTaskListItemPress = useCallback(
        ({ index, checked }: { index: number; checked: boolean; text: string }) => {
            if (!note || !normalizedMarkdown) return;
            const updatedMarkdown = toggleTaskInMarkdown(normalizedMarkdown, index, checked);
            updateNoteMutation.mutate({
                id: note.id,
                data: { content: updatedMarkdown },
            });
            toast.show({
                variant: "success",
                label: t("notes.detail.taskUpdated"),
            });
        },
        [note, normalizedMarkdown, updateNoteMutation, t, toast]
    );

    // Copy code block press
    const handleCopyCodePress = useCallback(
        async ({ code }: { code: string; language?: string }) => {
            if (!code) return;
            await Clipboard.setStringAsync(code);
            toast.show({
                variant: "success",
                label: t("notes.detail.copied"),
            });
        },
        [t, toast]
    );

    // Theme-aware markdown styling for reading view
    const markdownStyle = useMemo<MarkdownStyle>(
        () => ({
            paragraph: {
                fontSize: 17,
                lineHeight: 26,
                color: colors.onSurface,
                marginBottom: 14,
            },
            h1: {
                fontSize: 26,
                fontWeight: "bold",
                color: colors.onSurface,
                marginTop: 18,
                marginBottom: 12,
            },
            h2: {
                fontSize: 22,
                fontWeight: "bold",
                color: colors.onSurface,
                marginTop: 16,
                marginBottom: 10,
            },
            h3: {
                fontSize: 18,
                fontWeight: "bold",
                color: colors.onSurface,
                marginTop: 14,
                marginBottom: 8,
            },
            strong: { color: colors.onSurface },
            em: { color: colors.onSurface },
            link: { color: colors.secondary, underline: true },
            code: {
                fontSize: 14,
                color: colors.onSurface,
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                borderColor: colors.outlineVariant,
            },
            codeBlock: {
                fontSize: 14,
                color: colors.onSurface,
                backgroundColor: theme === "dark" ? "#1e1e24" : "#f1f5f9",
                borderColor: colors.outlineVariant,
                borderRadius: 14,
                padding: 14,
                marginBottom: 14,
            },
            blockquote: {
                borderColor: colors.secondary,
                borderWidth: 4,
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                padding: 12,
                borderRadius: 8,
                color: colors.onSurfaceVariant,
                marginBottom: 14,
            },
            list: {
                itemSpacing: 6,
                bulletColor: colors.secondary,
                markerColor: colors.secondary,
            },
            table: {
                fontSize: 14,
                borderColor: colors.outlineVariant,
                borderRadius: 12,
                headerBackgroundColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                cellPaddingHorizontal: 12,
                cellPaddingVertical: 8,
                marginBottom: 14,
            },
            taskList: {
                checkedColor: colors.secondary,
                checkmarkColor: "#ffffff",
                checkboxBorderRadius: 6,
            },
            spoiler: {
                color: colors.onSurface,
            },
            image: {
                borderRadius: 14,
                marginTop: 10,
                marginBottom: 14,
            },
        }),
        [colors, theme]
    );

    if (isLoading) {
        return (
            <View style={[common.screen, { backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }]}>
                <Spinner size="lg" color={colors.secondary} />
            </View>
        );
    }

    if (!note) {
        return (
            <View style={[common.screen, { backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }]}>
                <FlexText style={{ color: colors.onSurface, fontSize: 18, marginBottom: 12 }}>
                    {t("notes.detail.notFound")}
                </FlexText>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <FlexText style={{ color: colors.secondary, fontWeight: "600" }}>
                        {t("notes.detail.goBack")}
                    </FlexText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[common.screen, { backgroundColor: colors.surface }]}>
            {/* Floating Header */}
            <View
                style={[
                    styles.headerWrapper,
                    {
                        top: Math.max(insets.top, 16),
                    },
                ]}
            >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
                    {/* Back Button */}
                    <SquircleView
                        cornerSmoothing={100}
                        preserveSmoothing
                        style={[
                            styles.iconButtonSquircle,
                            {
                                backgroundColor: colors.surfaceContainer,
                                shadowColor: "#000",
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.iconButton}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                    </SquircleView>

                    {/* Note Title Pill */}
                    <SquircleView
                        cornerSmoothing={100}
                        preserveSmoothing
                        style={[
                            styles.titlePillSquircle,
                            {
                                backgroundColor: colors.surfaceContainer,
                                shadowColor: "#000",
                            },
                        ]}
                    >
                        <FlexText
                            numberOfLines={1}
                            style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: colors.onSurface,
                            }}
                        >
                            {parsedTitle || t("notes.detail.fallbackTitle")}
                        </FlexText>
                    </SquircleView>
                </View>

                {/* Edit Button */}
                <SquircleView
                    cornerSmoothing={100}
                    preserveSmoothing
                    style={[
                        styles.iconButtonSquircle,
                        {
                            backgroundColor: colors.surfaceContainer,
                            shadowColor: "#000",
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/create-note", params: { id: note.id } })}
                        style={styles.iconButton}
                    >
                        <Ionicons name="pencil" size={20} color={colors.onSurface} />
                    </TouchableOpacity>
                </SquircleView>
            </View>

            {/* Markdown Content View */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: Math.max(insets.top, 16) + 72,
                    paddingBottom: Math.max(insets.bottom, 16) + 40,
                }}
                showsVerticalScrollIndicator={false}
            >
                <EnrichedMarkdownText
                    flavor="github"
                    markdown={normalizedMarkdown}
                    markdownStyle={markdownStyle}
                    onLinkPress={handleLinkPress}
                    onTaskListItemPress={handleTaskListItemPress}
                    onCopyPress={handleCopyCodePress}
                    enableTaskListItemToggle={true}
                    selectable={true}
                />
            </ScrollView>
        </View>
    );
};

export default NoteDetailScreen;

const styles = StyleSheet.create({
    headerWrapper: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconButtonSquircle: {
        borderRadius: 20,
        width: 42,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
    iconButton: {
        width: 42,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
    },
    titlePillSquircle: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 42,
        justifyContent: "center",
        marginLeft: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
});
