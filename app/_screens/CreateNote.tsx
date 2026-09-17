import { GiphyDialog, GiphyRating } from "@giphy/react-native-sdk";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { router, useLocalSearchParams } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AutosizedTextInput } from "@/components/ui/AutosizedTextInput";
import {
    EnrichedMarkdownText,
    EnrichedMarkdownTextInput,
    type EnrichedMarkdownTextInputInstance,
    type MarkdownTextInputStyle,
    type StyleState,
} from "react-native-enriched-markdown";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { useCreateNote, useNote, useUpdateNote } from "@/services/note";
import { createCommonStyles } from "@/styles/common";
import { buildNoteMarkdown, parseNoteTitleAndBody } from "@/utils/noteMarkdown";

const CreateNoteScreen = () => {
    const { colors, typography, theme } = useThemeContext();
    const { t } = useTranslation();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const { toast } = useToast();

    const { id } = useLocalSearchParams();
    const noteId = id ? Number(id) : null;
    const isEditMode = noteId !== null;

    const { data: noteData, isLoading: isLoadingNote } = useNote(noteId || 0);
    const updateNoteMutation = useUpdateNote();
    const createNoteMutation = useCreateNote();

    const editorRef = useRef<EnrichedMarkdownTextInputInstance>(null);

    // Initial parsing for edit mode
    const initialParsed = useMemo(() => {
        if (isEditMode && noteData?.data?.content) {
            return parseNoteTitleAndBody(noteData.data.content);
        }
        return { title: "", body: "" };
    }, [isEditMode, noteData?.data?.content]);

    const [title, setTitle] = useState(initialParsed.title);
    const [bodyMarkdown, setBodyMarkdown] = useState(initialParsed.body);
    const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

    // Sync when noteData loads asynchronously in edit mode
    const hasInitializedRef = useRef(false);
    useEffect(() => {
        if (isEditMode && noteData?.data?.content && !hasInitializedRef.current) {
            const parsed = parseNoteTitleAndBody(noteData.data.content);
            setTitle(parsed.title);
            setBodyMarkdown(parsed.body);
            editorRef.current?.setValue(parsed.body);
            hasInitializedRef.current = true;
        }
    }, [isEditMode, noteData?.data?.content]);

    // Active formatting states from editor
    const [styleState, setStyleState] = useState<StyleState | null>(null);

    // Dialog States
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [imageCaption, setImageCaption] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    // Setup Giphy Dialog listener
    useEffect(() => {
        GiphyDialog.configure({
            theme: theme === "dark" ? "dark" : "light",
            rating: GiphyRating.R,
        });

        const listener = GiphyDialog.addListener("onMediaSelect", (e) => {
            const media = e.media;
            const images = media?.data?.images || (media as any)?.images;
            const gifUrl = images?.original?.url || images?.fixed_height?.url;

            if (gifUrl) {
                const gifMarkdown = `\n\n![GIF](${gifUrl})\n\n`;
                editorRef.current?.insertText(gifMarkdown);
                setBodyMarkdown((prev) => prev + gifMarkdown);
            }
            GiphyDialog.hide();
        });

        return () => listener.remove();
    }, [theme]);

    // Format actions
    const handleToggleBold = useCallback(() => {
        editorRef.current?.toggleBold();
    }, []);

    const handleToggleItalic = useCallback(() => {
        editorRef.current?.toggleItalic();
    }, []);

    const handleToggleUnderline = useCallback(() => {
        editorRef.current?.toggleUnderline();
    }, []);

    const handleToggleStrikethrough = useCallback(() => {
        editorRef.current?.toggleStrikethrough();
    }, []);

    const handleToggleSpoiler = useCallback(() => {
        editorRef.current?.toggleSpoiler();
    }, []);

    const handleToggleHeading = useCallback((level: 1 | 2 | 3) => {
        editorRef.current?.toggleHeading(level);
    }, []);

    const handleToggleUnorderedList = useCallback(() => {
        editorRef.current?.toggleUnorderedList();
    }, []);

    const handleToggleOrderedList = useCallback(() => {
        editorRef.current?.toggleOrderedList();
    }, []);

    const handleInsertTaskList = useCallback(() => {
        editorRef.current?.insertText("\n- [ ] ");
    }, []);

    const handleInsertQuote = useCallback(() => {
        editorRef.current?.insertText("\n> ");
    }, []);

    const handleInsertCodeBlock = useCallback(() => {
        editorRef.current?.insertText("\n```\n\n```\n");
    }, []);

    const handleInsertTable = useCallback(() => {
        const tableTemplate = "\n| Header 1 | Header 2 |\n| --- | --- |\n| Item 1 | Item 2 |\n";
        editorRef.current?.insertText(tableTemplate);
    }, []);

    const handleInsertDivider = useCallback(() => {
        editorRef.current?.insertText("\n---\n");
    }, []);

    // Link insertion
    const handleOpenLinkDialog = useCallback(() => {
        setLinkText("");
        setLinkUrl("");
        setIsLinkDialogOpen(true);
    }, []);

    const handleConfirmInsertLink = useCallback(() => {
        const trimmedUrl = linkUrl.trim();
        if (!trimmedUrl) return;

        let formattedUrl = trimmedUrl;
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        try {
            new URL(formattedUrl);
        } catch {
            toast.show({
                variant: "danger",
                label: t("notes.editor.invalidUrlTitle"),
                description: t("notes.editor.invalidUrlMalformedMessage"),
            });
            return;
        }

        const text = linkText.trim() || formattedUrl;
        editorRef.current?.insertLink(text, formattedUrl);
        setIsLinkDialogOpen(false);
    }, [linkText, linkUrl, t, toast]);

    // Image URL insertion
    const handleOpenImageDialog = useCallback(() => {
        setImageCaption("");
        setImageUrl("");
        setIsImageDialogOpen(true);
    }, []);

    const handleConfirmInsertImage = useCallback(() => {
        const trimmedUrl = imageUrl.trim();
        if (!trimmedUrl) return;

        let formattedUrl = trimmedUrl;
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const caption = imageCaption.trim() || "image";
        const imageMarkdown = `\n\n![${caption}](${formattedUrl})\n\n`;
        editorRef.current?.insertText(imageMarkdown);
        setBodyMarkdown((prev) => prev + imageMarkdown);
        setIsImageDialogOpen(false);
    }, [imageCaption, imageUrl]);

    // Clear note
    const handleConfirmClear = useCallback(() => {
        setTitle("");
        setBodyMarkdown("");
        editorRef.current?.setValue("");
        setIsClearDialogOpen(false);
    }, []);

    // Save note
    const handleSave = useCallback(() => {
        const fullMarkdown = buildNoteMarkdown(title, bodyMarkdown);
        if (!fullMarkdown.trim()) return;

        if (isEditMode && noteId) {
            if (updateNoteMutation.isPending) return;
            updateNoteMutation.mutate(
                { id: noteId, data: { content: fullMarkdown } },
                {
                    onSuccess: () => {
                        Keyboard.dismiss();
                        router.back();
                    },
                }
            );
        } else {
            if (createNoteMutation.isPending) return;
            createNoteMutation.mutate(
                { content: fullMarkdown },
                {
                    onSuccess: () => {
                        Keyboard.dismiss();
                        router.back();
                    },
                }
            );
        }
    }, [title, bodyMarkdown, isEditMode, noteId, updateNoteMutation, createNoteMutation]);

    const isSubmitting = createNoteMutation.isPending || updateNoteMutation.isPending;
    const canSubmit = (title.trim().length > 0 || bodyMarkdown.trim().length > 0) && !isSubmitting && !isLoadingNote;

    // Editor styling configurations
    const editorMarkdownStyle = useMemo<MarkdownTextInputStyle>(
        () => ({
            strong: { color: colors.onSurface },
            em: { color: colors.onSurface },
            link: { color: colors.secondary, underline: true },
            spoiler: {
                color: theme === "dark" ? "#1e293b" : "#e2e8f0",
                backgroundColor: theme === "dark" ? "#334155" : "#cbd5e1",
            },
            h1: { fontSize: 26, fontWeight: "bold", color: colors.onSurface },
            h2: { fontSize: 22, fontWeight: "bold", color: colors.onSurface },
            h3: { fontSize: 18, fontWeight: "bold", color: colors.onSurface },
            list: { itemSpacing: 4 },
        }),
        [colors, theme]
    );

    // Readonly preview styling configurations
    const previewMarkdownStyle = useMemo(
        () => ({
            paragraph: {
                fontSize: 16,
                lineHeight: 24,
                color: colors.onSurface,
                marginBottom: 12,
            },
            h1: { fontSize: 26, fontWeight: "bold", color: colors.onSurface, marginBottom: 12, marginTop: 16 },
            h2: { fontSize: 22, fontWeight: "bold", color: colors.onSurface, marginBottom: 10, marginTop: 14 },
            h3: { fontSize: 18, fontWeight: "bold", color: colors.onSurface, marginBottom: 8, marginTop: 12 },
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
                borderRadius: 12,
                padding: 12,
            },
            blockquote: {
                borderColor: colors.secondary,
                borderWidth: 3,
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                padding: 10,
                borderRadius: 6,
                color: colors.onSurfaceVariant,
            },
            table: {
                fontSize: 14,
                borderColor: colors.outlineVariant,
                borderRadius: 10,
                headerBackgroundColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                cellPaddingHorizontal: 10,
                cellPaddingVertical: 6,
            },
            taskList: {
                checkedColor: colors.secondary,
                checkmarkColor: "#ffffff",
            },
            spoiler: {
                color: colors.onSurface,
            },
            image: {
                borderRadius: 12,
                marginTop: 8,
                marginBottom: 12,
            },
        }),
        [colors, theme]
    );

    if (isEditMode && isLoadingNote) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
                <Spinner size="lg" color={colors.secondary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[common.screen, { backgroundColor: colors.surface }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header (Floating Squircle) */}
            <SquircleView
                cornerSmoothing={100}
                preserveSmoothing
                style={[
                    styles.headerContainer,
                    {
                        top: Math.max(insets.top, 16),
                        backgroundColor: colors.surfaceContainer,
                        shadowColor: "#000",
                    },
                ]}
            >
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.headerIconButton, { backgroundColor: colors.surfaceContainerHigh }]}
                >
                    <Ionicons name="close" size={22} color={colors.onSurface} />
                </TouchableOpacity>

                {/* Title & Preview Toggle */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setViewMode(viewMode === "editor" ? "preview" : "editor")}
                        style={[
                            styles.viewModeButton,
                            {
                                backgroundColor:
                                    viewMode === "preview" ? colors.secondaryContainer : colors.surfaceContainerHigh,
                            },
                        ]}
                    >
                        <MaterialIcons
                            name={viewMode === "preview" ? "visibility" : "edit"}
                            size={16}
                            color={viewMode === "preview" ? colors.secondary : colors.onSurface}
                        />
                        <FlexText
                            style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: viewMode === "preview" ? colors.secondary : colors.onSurface,
                            }}
                        >
                            {viewMode === "preview" ? t("notes.editor.preview") : t("notes.editor.edit")}
                        </FlexText>
                    </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!canSubmit}
                    style={[
                        styles.saveButton,
                        {
                            backgroundColor: canSubmit ? colors.secondary : colors.surfaceContainerHighest,
                            opacity: canSubmit ? 1 : 0.6,
                        },
                    ]}
                >
                    {isSubmitting ? (
                        <Spinner size="sm" color="#ffffff" />
                    ) : (
                        <FlexText style={{ color: canSubmit ? "#ffffff" : colors.onSurfaceVariant, fontWeight: "bold", fontSize: 14 }}>
                            {t("notes.editor.save")}
                        </FlexText>
                    )}
                </TouchableOpacity>
            </SquircleView>

            {/* Content Area */}
            {viewMode === "preview" ? (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 20,
                        paddingTop: Math.max(insets.top, 16) + 72,
                        paddingBottom: Math.max(insets.bottom, 16) + 40,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <EnrichedMarkdownText
                        flavor="github"
                        markdown={buildNoteMarkdown(title, bodyMarkdown) || `*${t("notes.list.emptyDescription")}*`}
                        markdownStyle={previewMarkdownStyle}
                    />
                </ScrollView>
            ) : (
                <KeyboardAwareScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 18,
                        paddingTop: Math.max(insets.top, 16) + 72,
                        paddingBottom: Math.max(insets.bottom, 16) + 120,
                    }}
                    bottomOffset={100}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Note Title Input (Autosized) */}
                    <AutosizedTextInput
                        minRows={1}
                        maxRows={3}
                        style={[
                            styles.titleInput,
                            {
                                color: colors.onSurface,
                                borderBottomColor: colors.outlineVariant,
                            },
                        ]}
                        placeholder={t("notes.editor.noteTitlePlaceholder")}
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={title}
                        onChangeText={setTitle}
                        returnKeyType="next"
                        onSubmitEditing={() => editorRef.current?.focus()}
                    />

                    {/* Enriched Markdown Body Input */}
                    <EnrichedMarkdownTextInput
                        ref={editorRef}
                        defaultValue={initialParsed.body}
                        placeholder={t("notes.editor.contentPlaceholder")}
                        placeholderTextColor={colors.onSurfaceVariant}
                        multiline
                        scrollEnabled={false}
                        markdownStyle={editorMarkdownStyle}
                        onChangeMarkdown={setBodyMarkdown}
                        onChangeState={setStyleState}
                        style={StyleSheet.flatten([
                            styles.editorInput,
                            {
                                color: colors.onSurface,
                            },
                        ])}
                    />
                </KeyboardAwareScrollView>
            )}

            {/* Floating Rich Formatting Toolbar (Visible in Editor Mode) */}
            {viewMode === "editor" && (
                <View
                    style={[
                        styles.toolbarContainer,
                        {
                            bottom: Math.max(insets.bottom, 12),
                        },
                    ]}
                >
                    <SquircleView
                        cornerSmoothing={100}
                        preserveSmoothing
                        style={[
                            styles.toolbarSquircle,
                            {
                                backgroundColor: colors.surfaceContainer,
                                shadowColor: "#000",
                            },
                        ]}
                    >
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.toolbarScrollContent}
                            keyboardShouldPersistTaps="always"
                        >
                            {/* H1 Heading */}
                            <TouchableOpacity
                                onPress={() => handleToggleHeading(1)}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.heading.isActive && styleState?.heading.level === 1 && {
                                        backgroundColor: colors.secondaryContainer,
                                    },
                                ]}
                            >
                                <FlexText
                                    style={[
                                        styles.headingBtnText,
                                        {
                                            color:
                                                styleState?.heading.isActive && styleState?.heading.level === 1
                                                    ? colors.secondary
                                                    : colors.onSurface,
                                        },
                                    ]}
                                >
                                    H1
                                </FlexText>
                            </TouchableOpacity>

                            {/* H2 Heading */}
                            <TouchableOpacity
                                onPress={() => handleToggleHeading(2)}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.heading.isActive && styleState?.heading.level === 2 && {
                                        backgroundColor: colors.secondaryContainer,
                                    },
                                ]}
                            >
                                <FlexText
                                    style={[
                                        styles.headingBtnText,
                                        {
                                            color:
                                                styleState?.heading.isActive && styleState?.heading.level === 2
                                                    ? colors.secondary
                                                    : colors.onSurface,
                                        },
                                    ]}
                                >
                                    H2
                                </FlexText>
                            </TouchableOpacity>

                            {/* H3 Heading */}
                            <TouchableOpacity
                                onPress={() => handleToggleHeading(3)}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.heading.isActive && styleState?.heading.level === 3 && {
                                        backgroundColor: colors.secondaryContainer,
                                    },
                                ]}
                            >
                                <FlexText
                                    style={[
                                        styles.headingBtnText,
                                        {
                                            color:
                                                styleState?.heading.isActive && styleState?.heading.level === 3
                                                    ? colors.secondary
                                                    : colors.onSurface,
                                        },
                                    ]}
                                >
                                    H3
                                </FlexText>
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Bold */}
                            <TouchableOpacity
                                onPress={handleToggleBold}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.bold.isActive && { backgroundColor: colors.secondaryContainer },
                                ]}
                            >
                                <MaterialIcons
                                    name="format-bold"
                                    size={20}
                                    color={styleState?.bold.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            {/* Italic */}
                            <TouchableOpacity
                                onPress={handleToggleItalic}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.italic.isActive && { backgroundColor: colors.secondaryContainer },
                                ]}
                            >
                                <MaterialIcons
                                    name="format-italic"
                                    size={20}
                                    color={styleState?.italic.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            {/* Underline */}
                            <TouchableOpacity
                                onPress={handleToggleUnderline}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.underline.isActive && { backgroundColor: colors.secondaryContainer },
                                ]}
                            >
                                <MaterialIcons
                                    name="format-underlined"
                                    size={20}
                                    color={styleState?.underline.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            {/* Strikethrough */}
                            <TouchableOpacity
                                onPress={handleToggleStrikethrough}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.strikethrough.isActive && {
                                        backgroundColor: colors.secondaryContainer,
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name="format-strikethrough"
                                    size={20}
                                    color={styleState?.strikethrough.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            {/* Spoiler */}
                            <TouchableOpacity
                                onPress={handleToggleSpoiler}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.spoiler.isActive && { backgroundColor: colors.secondaryContainer },
                                ]}
                            >
                                <MaterialIcons
                                    name="visibility-off"
                                    size={18}
                                    color={styleState?.spoiler.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Bullet List */}
                            <TouchableOpacity
                                onPress={handleToggleUnorderedList}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.unorderedList.isActive && {
                                        backgroundColor: colors.secondaryContainer,
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name="format-list-bulleted"
                                    size={20}
                                    color={styleState?.unorderedList.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            {/* Numbered List */}
                            <TouchableOpacity
                                onPress={handleToggleOrderedList}
                                style={[
                                    styles.toolbarBtn,
                                    styleState?.orderedList.isActive && {
                                        backgroundColor: colors.secondaryContainer,
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name="format-list-numbered"
                                    size={20}
                                    color={styleState?.orderedList.isActive ? colors.secondary : colors.onSurface}
                                />
                            </TouchableOpacity>

                            {/* Task List Item */}
                            <TouchableOpacity onPress={handleInsertTaskList} style={styles.toolbarBtn}>
                                <MaterialIcons name="check-box" size={18} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Blockquote */}
                            <TouchableOpacity onPress={handleInsertQuote} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-quote" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Code Block */}
                            <TouchableOpacity onPress={handleInsertCodeBlock} style={styles.toolbarBtn}>
                                <MaterialIcons name="code" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Table */}
                            <TouchableOpacity onPress={handleInsertTable} style={styles.toolbarBtn}>
                                <MaterialIcons name="grid-on" size={18} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Divider */}
                            <TouchableOpacity onPress={handleInsertDivider} style={styles.toolbarBtn}>
                                <MaterialIcons name="horizontal-rule" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Insert Link */}
                            <TouchableOpacity onPress={handleOpenLinkDialog} style={styles.toolbarBtn}>
                                <MaterialIcons name="link" size={20} color={colors.secondary} />
                            </TouchableOpacity>

                            {/* Insert Image URL */}
                            <TouchableOpacity onPress={handleOpenImageDialog} style={styles.toolbarBtn}>
                                <MaterialIcons name="image" size={20} color={colors.secondary} />
                            </TouchableOpacity>

                            {/* Giphy GIF */}
                            <TouchableOpacity onPress={() => GiphyDialog.show()} style={styles.toolbarBtn}>
                                <MaterialIcons name="gif" size={24} color={colors.secondary} />
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Clear All */}
                            <TouchableOpacity onPress={() => setIsClearDialogOpen(true)} style={styles.toolbarBtn}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </ScrollView>
                    </SquircleView>
                </View>
            )}

            {/* Insert Link Dialog */}
            <Dialog isOpen={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 16 }}>
                            <Dialog.Title>{t("notes.editor.insertLinkTitle")}</Dialog.Title>
                        </View>
                        <View style={{ gap: 12, marginBottom: 20 }}>
                            <View>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurfaceVariant, marginBottom: 6 }}>
                                    {t("notes.editor.linkTextLabel")}
                                </FlexText>
                                <TextInput
                                    style={[styles.dialogInput, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                                    placeholder={t("notes.editor.linkTextPlaceholder")}
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={linkText}
                                    onChangeText={setLinkText}
                                />
                            </View>
                            <View>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurfaceVariant, marginBottom: 6 }}>
                                    {t("notes.editor.linkUrlLabel")}
                                </FlexText>
                                <TextInput
                                    style={[styles.dialogInput, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                                    placeholder={t("notes.editor.linkUrlPlaceholder")}
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={linkUrl}
                                    onChangeText={setLinkUrl}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                            <Button variant="ghost" onPress={() => setIsLinkDialogOpen(false)}>
                                {t("notes.editor.cancel")}
                            </Button>
                            <Button variant="primary" onPress={handleConfirmInsertLink} isDisabled={!linkUrl.trim()}>
                                {t("notes.editor.insert")}
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>

            {/* Insert Image Dialog */}
            <Dialog isOpen={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 16 }}>
                            <Dialog.Title>{t("notes.editor.insertImageTitle")}</Dialog.Title>
                        </View>
                        <View style={{ gap: 12, marginBottom: 20 }}>
                            <View>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurfaceVariant, marginBottom: 6 }}>
                                    {t("notes.editor.imageCaptionLabel")}
                                </FlexText>
                                <TextInput
                                    style={[styles.dialogInput, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                                    placeholder={t("notes.editor.imageCaptionPlaceholder")}
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={imageCaption}
                                    onChangeText={setImageCaption}
                                />
                            </View>
                            <View>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurfaceVariant, marginBottom: 6 }}>
                                    {t("notes.editor.imageUrlLabel")}
                                </FlexText>
                                <TextInput
                                    style={[styles.dialogInput, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                                    placeholder={t("notes.editor.imageUrlPlaceholder")}
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                            <Button variant="ghost" onPress={() => setIsImageDialogOpen(false)}>
                                {t("notes.editor.cancel")}
                            </Button>
                            <Button variant="primary" onPress={handleConfirmInsertImage} isDisabled={!imageUrl.trim()}>
                                {t("notes.editor.insert")}
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>

            {/* Clear All Confirmation Dialog */}
            <Dialog isOpen={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 16 }}>
                            <Dialog.Title>{t("notes.editor.clearAllTitle")}</Dialog.Title>
                            <Dialog.Description>{t("notes.editor.clearAllMessage")}</Dialog.Description>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                            <Button variant="ghost" onPress={() => setIsClearDialogOpen(false)}>
                                {t("notes.editor.cancel")}
                            </Button>
                            <Button variant="danger" onPress={handleConfirmClear}>
                                {t("notes.editor.clear")}
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
        </KeyboardAvoidingView>
    );
};

export default CreateNoteScreen;

const styles = StyleSheet.create({
    headerContainer: {
        position: "absolute",
        left: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 10,
        zIndex: 100,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    headerIconButton: {
        borderRadius: 999,
        width: 38,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
    },
    viewModeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        minWidth: 64,
        alignItems: "center",
        justifyContent: "center",
    },
    titleInput: {
        fontSize: 24,
        fontWeight: "bold",
        paddingVertical: 10,
        paddingHorizontal: 4,
        marginBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    editorInput: {
        fontSize: 16,
        lineHeight: 24,
        minHeight: 260,
        paddingTop: 12,
        paddingHorizontal: 4,
    },
    toolbarContainer: {
        position: "absolute",
        left: 12,
        right: 12,
        zIndex: 100,
    },
    toolbarSquircle: {
        borderRadius: 22,
        paddingVertical: 6,
        paddingHorizontal: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    toolbarScrollContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 4,
    },
    toolbarBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    headingBtnText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    toolbarDivider: {
        width: 1,
        height: 20,
        marginHorizontal: 4,
        opacity: 0.5,
    },
    dialogInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
    },
});
