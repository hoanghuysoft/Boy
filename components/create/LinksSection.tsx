import { XmarkSolid } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-native-lineicons";
import React, { memo } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { Link } from "../../types/post";
import { useTranslation } from "react-i18next";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";
import { COLORS } from "./types";

// ============================================================================
// LinkItem Component
// ============================================================================

// ============================================================================
// LinkItem Component
// ============================================================================

interface LinkItemProps {
    link: Link;
    index: number;
    onUpdate: (field: keyof Link, value: string) => void;
    onRemove: () => void;
    colors: ThemeColors;
    common: any;
}

const LinkItem = memo(({
    link,
    onUpdate,
    onRemove,
    colors,
    common,
}: LinkItemProps) => {
    const { t } = useTranslation();

    return (
    <View style={[createStyles.linkItemContainer, { backgroundColor: colors.card }]}>
        <View style={createStyles.linkInputsContainer}>
            <TextInput
                style={[createStyles.linkInput, common.body, { color: colors.text, borderColor: colors.divider }]}
                placeholder={t('create.form.linkLabelPlaceholder')}
                placeholderTextColor={colors.muted}
                value={link.label}
                onChangeText={(text) => onUpdate("label", text)}
            />
            <TextInput
                style={[createStyles.linkInput, common.body, { color: colors.text, borderColor: colors.divider }]}
                placeholder={t('create.form.linkUrlPlaceholder')}
                placeholderTextColor={colors.muted}
                value={link.url}
                onChangeText={(text) => onUpdate("url", text)}
                keyboardType="url"
                autoCapitalize="none"
            />
        </View>
        <TouchableOpacity
            style={[createStyles.removeLinkButton, { backgroundColor: COLORS.error }]}
            onPress={onRemove}
        >
            <Lineicons icon={XmarkSolid} size={12} color="#fff" />
        </TouchableOpacity>
    </View>
);});

LinkItem.displayName = "LinkItem";

// ============================================================================
// LinksSection Component
// ============================================================================

interface LinksSectionProps {
    visible: boolean;
    links: Link[];
    colors: ThemeColors;
    common: any;
    onUpdateLink: (index: number, field: keyof Link, value: string) => void;
    onRemoveLink: (index: number) => void;
}

export const LinksSection = memo(({
    visible,
    links,
    colors,
    common,
    onUpdateLink,
    onRemoveLink,
}: LinksSectionProps) => {
    const { t } = useTranslation();

    if (!visible || links.length === 0) return null;

    return (
        <View style={createStyles.linksSection}>
            <FlexText style={[common.label, { color: colors.text, marginBottom: 12 }]}>
                {t('create.form.links')}
            </FlexText>
            {links.map((link, index) => (
                <LinkItem
                    key={index}
                    link={link}
                    index={index}
                    onUpdate={(field, value) => onUpdateLink(index, field, value)}
                    onRemove={() => onRemoveLink(index)}
                    colors={colors}
                    common={common}
                />
            ))}
        </View>
    );
});

LinksSection.displayName = "LinksSection";
