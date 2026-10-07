import { FlexText } from "@/components/FlexText";
import SpinButton from "@/components/ui/micro-interactions/spin-button";
import { useThemeContext } from "@/context/ThemeContext";
import { useCreateNote, useUpdateNote } from "@/services/note";
import { createCommonStyles } from "@/styles/common";
import {
    buildNoteMarkdown,
    getNoteMarkdownStyle,
    parseNoteTitleAndBody,
    toggleTaskInMarkdown,
} from "@/utils/noteMarkdown";
import { GiphyDialog, GiphyRating } from "@giphy/react-native-sdk";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { router, useLocalSearchParams } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
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
import {
    EnrichedMarkdownText,
} from "react-native-enriched-markdown";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CreateNoteScreen = () => {
    const { colors, typography, theme } = useThemeContext();
    const { t } = useTranslation();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const { toast } = useToast();

    const { id, initialContent } = useLocalSearchParams<{ id?: string; initialContent?: string }>();
    const noteId = id ? Number(id) : null;
    const isEditMode = noteId !== null;

    const updateNoteMutation = useUpdateNote();
    const createNoteMutation = useCreateNote();

    const titleInputRef = useRef<TextInput>(null);
    const inputRef = useRef<TextInput>(null);

    const initialParsed = useMemo(() => {
        return parseNoteTitleAndBody(initialContent || "");
    }, [initialContent]);

    const [title, setTitle] = useState(initialParsed.title);
    const [content, setContent] = useState(initialParsed.body);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

    // Sync when initialContent route param changes
    useEffect(() => {
        if (initialContent !== undefined) {
            const { title: parsedTitle, body: parsedBody } = parseNoteTitleAndBody(initialContent);
            setTitle(parsedTitle);
            setContent(parsedBody);
        }
    }, [initialContent]);

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
                insertTemplateAtCursor(`![GIF](${gifUrl})`);
            }
            GiphyDialog.hide();
        });

        return () => listener.remove();
    }, [theme]);

    // Helper: Wrap currently selected text with markdown delimiters
    const wrapSelection = useCallback(
        (prefix: string, suffix: string = prefix, placeholder: string = "") => {
            const { start, end } = selection;
            const selectedText = content.substring(start, end) || placeholder;
            const replacement = `${prefix}${selectedText}${suffix}`;
            const newContent = content.substring(0, start) + replacement + content.substring(end);
            setContent(newContent);
            const newPos = start + prefix.length + selectedText.length;
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        },
        [content, selection]
    );

    // Helper: Prefix lines (headings, lists, blockquotes)
    const prefixLines = useCallback(
        (prefix: string) => {
            const { start, end } = selection;
            const beforeSelection = content.substring(0, start);
            const lastNewline = beforeSelection.lastIndexOf("\n");
            const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

            const afterSelection = content.substring(end);
            const nextNewline = afterSelection.indexOf("\n");
            const lineEnd = nextNewline === -1 ? content.length : end + nextNewline;

            const affectedText = content.substring(lineStart, lineEnd);
            const lines = affectedText.split("\n");
            const updatedLines = lines.map((line) => {
                if (line.startsWith(prefix)) {
                    return line.substring(prefix.length);
                }
                // Strip existing heading/list prefix if applying a new one
                const cleanLine = line.replace(/^(#{1,6}\s+|[-*+]\s+(\[[ xX]\]\s+)?|\d+\.\s+|> \s*)/, "");
                return `${prefix}${cleanLine}`;
            });
            const replacement = updatedLines.join("\n");
            const newContent = content.substring(0, lineStart) + replacement + content.substring(lineEnd);
            setContent(newContent);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        },
        [content, selection]
    );

    // Helper: Insert a block template at cursor position
    const insertTemplateAtCursor = useCallback(
        (template: string) => {
            const { start, end } = selection;
            const before = content.substring(0, start);
            const after = content.substring(end);
            const needLeadingNewline = before.length > 0 && !before.endsWith("\n");
            const needTrailingNewline = after.length > 0 && !after.startsWith("\n");
            const formattedTemplate = `${needLeadingNewline ? "\n" : ""}${template}${needTrailingNewline ? "\n" : ""}`;
            const newContent = before + formattedTemplate + after;
            setContent(newContent);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        },
        [content, selection]
    );

    // Format actions
    const handleToggleBold = useCallback(() => {
        wrapSelection("**", "**", "bold");
    }, [wrapSelection]);

    const handleToggleItalic = useCallback(() => {
        wrapSelection("*", "*", "italic");
    }, [wrapSelection]);

    const handleToggleUnderline = useCallback(() => {
        wrapSelection("<u>", "</u>", "underline");
    }, [wrapSelection]);

    const handleToggleStrikethrough = useCallback(() => {
        wrapSelection("~~", "~~", "strikethrough");
    }, [wrapSelection]);

    const handleToggleSpoiler = useCallback(() => {
        wrapSelection("||", "||", "spoiler");
    }, [wrapSelection]);

    const handleToggleHeading = useCallback(
        (level: 1 | 2 | 3) => {
            const prefix = `${"#".repeat(level)} `;
            prefixLines(prefix);
        },
        [prefixLines]
    );

    const handleToggleUnorderedList = useCallback(() => {
        prefixLines("- ");
    }, [prefixLines]);

    const handleToggleOrderedList = useCallback(() => {
        prefixLines("1. ");
    }, [prefixLines]);

    const handleInsertTaskList = useCallback(() => {
        insertTemplateAtCursor("- [ ] Task 1\n- [ ] Task 2");
    }, [insertTemplateAtCursor]);

    const handleInsertQuote = useCallback(() => {
        prefixLines("> ");
    }, [prefixLines]);

    const handleInsertCodeBlock = useCallback(() => {
        insertTemplateAtCursor("```\n// code block\n```");
    }, [insertTemplateAtCursor]);

    const handleInsertTable = useCallback(() => {
        insertTemplateAtCursor("| Header 1 | Header 2 |\n| --- | --- |\n| Item 1 | Item 2 |");
    }, [insertTemplateAtCursor]);

    const handleInsertDivider = useCallback(() => {
        insertTemplateAtCursor("---");
    }, [insertTemplateAtCursor]);

    // Toggle Preview / Editor
    const handleToggleViewMode = useCallback(() => {
        setViewMode((prev) => (prev === "editor" ? "preview" : "editor"));
    }, []);

    // Interactive task checkbox toggle in Preview mode
    const handleTaskListItemPress = useCallback(
        ({ index, checked }: { index: number; checked: boolean }) => {
            setContent((prev) => toggleTaskInMarkdown(prev, index, checked));
        },
        []
    );

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
        insertTemplateAtCursor(`[${text}](${formattedUrl})`);
        setIsLinkDialogOpen(false);
    }, [linkText, linkUrl, insertTemplateAtCursor, t, toast]);

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
        insertTemplateAtCursor(`![${caption}](${formattedUrl})`);
        setIsImageDialogOpen(false);
    }, [imageCaption, imageUrl, insertTemplateAtCursor]);

    // Clear note
    const handleConfirmClear = useCallback(() => {
        setTitle("");
        setContent("");
        setIsClearDialogOpen(false);
    }, []);

    // Save note
    const handleSave = useCallback(async () => {
        const fullContent = buildNoteMarkdown(title, content).trim();
        if (!fullContent) return;

        if (isEditMode && noteId) {
            if (updateNoteMutation.isPending) return;
            updateNoteMutation.mutate(
                { id: noteId, data: { content: fullContent } },
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
                { content: fullContent },
                {
                    onSuccess: () => {
                        Keyboard.dismiss();
                        router.back();
                    },
                }
            );
        }
    }, [title, content, isEditMode, noteId, updateNoteMutation, createNoteMutation]);

    const isSubmitting = createNoteMutation.isPending || updateNoteMutation.isPending;
    const canSubmit = (title.trim().length > 0 || content.trim().length > 0) && !isSubmitting;

    // Readonly preview styling configurations
    const previewMarkdownStyle = useMemo(
        () => getNoteMarkdownStyle(colors, theme, false),
        [colors, theme]
    );

    const previewMarkdown = useMemo(() => {
        return buildNoteMarkdown(title, content);
    }, [title, content]);

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
                        onPress={handleToggleViewMode}
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
                <SpinButton
                    idleText={t("notes.editor.save", "Save")}
                    activeText={t("notes.editor.saving", "Saving...")}
                    controlled
                    isActive={isSubmitting}
                    disabled={!canSubmit || isSubmitting}
                    onPress={handleSave}
                    animationConfig={{
                        spring: {
                            damping: 50,
                            stiffness: 250,
                            mass: 1,
                        },
                    }}
                    colors={{
                        idle: {
                            background: canSubmit ? colors.secondary : colors.surfaceContainerHighest,
                            text: canSubmit ? "#ffffff" : colors.onSurfaceVariant,
                        },
                        active: {
                            background: colors.secondary,
                            text: "#ffffff",
                        },
                    }}
                    spinnerConfig={{
                        color: "#ffffff",
                        containerBackground: colors.secondary,
                    }}
                    buttonStyle={{
                        paddingHorizontal: 2,
                    }}
                />
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
                        markdown={previewMarkdown || `*${t("notes.list.emptyDescription")}*`}
                        markdownStyle={previewMarkdownStyle}
                        md4cFlags={{ hardSoftBreaks: true }}
                        onTaskListItemPress={handleTaskListItemPress}
                        enableTaskListItemToggle={true}
                        selectable={true}
                    />
                </ScrollView>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        paddingTop: Math.max(insets.top, 16) + 72,
                        paddingBottom: Math.max(insets.bottom, 16) + 80,
                    }}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title Input */}
                    <TextInput
                        ref={titleInputRef}
                        value={title}
                        onChangeText={setTitle}
                        placeholder={t("notes.editor.noteTitlePlaceholder")}
                        placeholderTextColor={colors.onSurfaceVariant}
                        returnKeyType="next"
                        onSubmitEditing={() => inputRef.current?.focus()}
                        blurOnSubmit={false}
                        cursorColor={colors.secondary}
                        selectionColor={colors.secondaryContainer}
                        style={[
                            styles.titleInput,
                            {
                                color: colors.onSurface,
                            },
                        ]}
                    />

                    {/* Subtle divider between title and body */}
                    <View style={[styles.editorDivider, { backgroundColor: colors.outlineVariant }]} />

                    {/* Body Content Input */}
                    <TextInput
                        ref={inputRef}
                        value={content}
                        onChangeText={setContent}
                        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                        placeholder={t("notes.editor.contentPlaceholder")}
                        placeholderTextColor={colors.onSurfaceVariant}
                        multiline
                        scrollEnabled={false}
                        cursorColor={colors.secondary}
                        selectionColor={colors.secondaryContainer}
                        textAlignVertical="top"
                        style={[
                            styles.editorInput,
                            {
                                color: colors.onSurface,
                            },
                        ]}
                    />
                </ScrollView>
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
                                style={styles.toolbarBtn}
                            >
                                <FlexText style={[styles.headingBtnText, { color: colors.onSurface }]}>
                                    H1
                                </FlexText>
                            </TouchableOpacity>

                            {/* H2 Heading */}
                            <TouchableOpacity
                                onPress={() => handleToggleHeading(2)}
                                style={styles.toolbarBtn}
                            >
                                <FlexText style={[styles.headingBtnText, { color: colors.onSurface }]}>
                                    H2
                                </FlexText>
                            </TouchableOpacity>

                            {/* H3 Heading */}
                            <TouchableOpacity
                                onPress={() => handleToggleHeading(3)}
                                style={styles.toolbarBtn}
                            >
                                <FlexText style={[styles.headingBtnText, { color: colors.onSurface }]}>
                                    H3
                                </FlexText>
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Bold */}
                            <TouchableOpacity onPress={handleToggleBold} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-bold" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Italic */}
                            <TouchableOpacity onPress={handleToggleItalic} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-italic" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Underline */}
                            <TouchableOpacity onPress={handleToggleUnderline} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-underlined" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Strikethrough */}
                            <TouchableOpacity onPress={handleToggleStrikethrough} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-strikethrough" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Spoiler */}
                            <TouchableOpacity onPress={handleToggleSpoiler} style={styles.toolbarBtn}>
                                <MaterialIcons name="visibility-off" size={18} color={colors.onSurface} />
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Bullet List */}
                            <TouchableOpacity onPress={handleToggleUnorderedList} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-list-bulleted" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Numbered List */}
                            <TouchableOpacity onPress={handleToggleOrderedList} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-list-numbered" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Task List */}
                            <TouchableOpacity onPress={handleInsertTaskList} style={styles.toolbarBtn}>
                                <MaterialIcons name="check-box" size={19} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Quote */}
                            <TouchableOpacity onPress={handleInsertQuote} style={styles.toolbarBtn}>
                                <MaterialIcons name="format-quote" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Code Block */}
                            <TouchableOpacity onPress={handleInsertCodeBlock} style={styles.toolbarBtn}>
                                <MaterialIcons name="code" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Table */}
                            <TouchableOpacity onPress={handleInsertTable} style={styles.toolbarBtn}>
                                <MaterialIcons name="table-chart" size={19} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Divider Line */}
                            <TouchableOpacity onPress={handleInsertDivider} style={styles.toolbarBtn}>
                                <MaterialIcons name="horizontal-rule" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Insert Link */}
                            <TouchableOpacity onPress={handleOpenLinkDialog} style={styles.toolbarBtn}>
                                <MaterialIcons name="link" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Insert Image URL */}
                            <TouchableOpacity onPress={handleOpenImageDialog} style={styles.toolbarBtn}>
                                <MaterialIcons name="image" size={20} color={colors.onSurface} />
                            </TouchableOpacity>

                            {/* Giphy GIF Picker */}
                            <TouchableOpacity onPress={() => GiphyDialog.show()} style={styles.toolbarBtn}>
                                <MaterialIcons name="gif" size={26} color={colors.onSurface} />
                            </TouchableOpacity>

                            <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />

                            {/* Clear All */}
                            <TouchableOpacity onPress={() => setIsClearDialogOpen(true)} style={styles.toolbarBtn}>
                                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </ScrollView>
                    </SquircleView>
                </View>
            )}

            {/* Link Dialog */}
            <Dialog isOpen={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 16 }}>
                            <Dialog.Title>{t("notes.editor.insertLinkTitle")}</Dialog.Title>
                        </View>
                        <View style={{ gap: 14, marginBottom: 20 }}>
                            <View style={{ gap: 6 }}>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>
                                    {t("notes.editor.linkTextLabel")}
                                </FlexText>
                                <TextInput
                                    style={[
                                        styles.dialogInput,
                                        {
                                            color: colors.onSurface,
                                            borderColor: colors.outlineVariant,
                                            backgroundColor: colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    placeholder={t("notes.editor.linkTextPlaceholder")}
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={linkText}
                                    onChangeText={setLinkText}
                                />
                            </View>
                            <View style={{ gap: 6 }}>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>
                                    {t("notes.editor.linkUrlLabel")}
                                </FlexText>
                                <TextInput
                                    style={[
                                        styles.dialogInput,
                                        {
                                            color: colors.onSurface,
                                            borderColor: colors.outlineVariant,
                                            backgroundColor: colors.surfaceContainerHigh,
                                        },
                                    ]}
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

            {/* Image URL Dialog */}
            <Dialog isOpen={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 16 }}>
                            <Dialog.Title>{t("notes.editor.insertImageTitle")}</Dialog.Title>
                        </View>
                        <View style={{ gap: 14, marginBottom: 20 }}>
                            <View style={{ gap: 6 }}>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>
                                    {t("notes.editor.imageCaptionLabel")}
                                </FlexText>
                                <TextInput
                                    style={[
                                        styles.dialogInput,
                                        {
                                            color: colors.onSurface,
                                            borderColor: colors.outlineVariant,
                                            backgroundColor: colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    placeholder={t("notes.editor.imageCaptionPlaceholder")}
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={imageCaption}
                                    onChangeText={setImageCaption}
                                />
                            </View>
                            <View style={{ gap: 6 }}>
                                <FlexText style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>
                                    {t("notes.editor.imageUrlLabel")}
                                </FlexText>
                                <TextInput
                                    style={[
                                        styles.dialogInput,
                                        {
                                            color: colors.onSurface,
                                            borderColor: colors.outlineVariant,
                                            backgroundColor: colors.surfaceContainerHigh,
                                        },
                                    ]}
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
        fontSize: 22,
        fontWeight: "bold",
        paddingHorizontal: 4,
        paddingTop: 8,
        paddingBottom: 6,
    },
    editorDivider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 4,
        marginVertical: 8,
        opacity: 0.6,
    },
    editorInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        paddingHorizontal: 4,
        paddingTop: 4,
        minHeight: 240,
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
