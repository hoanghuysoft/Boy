import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
    CalendarBold,
    CaseMinimalisticBold,
    LetterBold,
    MenBold,
    NotebookBookmarkBold,
    PhoneBold,
    PointOnMapBold,
    SquareAcademicCapBold,
    WeigherBold,
    WheelBold,
    WomenBold,
} from '@solar-icons/react-native';
import React, { forwardRef, memo, useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TurboImage from "react-native-turbo-image";
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileDetail } from "../../../types/profiledetail";
import { Workplace } from "../../../types/profileworplace";
import { getFamilyAvatarSource } from "../../../utils/familyAvatar";
import { useSheetBackHandler } from "./useSheetBackHandler";

interface BriefInfoSheetProps {
    profile?: ProfileDetail | null;
    workplaces?: Workplace[];
    homeInfo?: string | null;
}

type InfoItem =
    | { kind: 'solar'; icon: any; label: string; sublabel?: string }
    | { kind: 'ionicons'; name: string; label: string; sublabel?: string }
    | { kind: 'material'; name: string; label: string; sublabel?: string }
    | { kind: 'image'; source: any; label: string; sublabel?: string }
    | { kind: 'bank'; logo?: string; label: string; sublabel?: string };

interface Section {
    title: string;
    items: InfoItem[];
}

const InfoRow = memo(({ item, colors }: { item: InfoItem; colors: any }) => {
    const iconBg = (colors.primary || colors.text) + '15';

    const renderIcon = () => {
        switch (item.kind) {
            case 'solar':
                return <item.icon size={22} color={colors.primary || colors.text} />;
            case 'ionicons':
                return <Ionicons name={item.name as any} size={22} color={colors.primary || colors.text} />;
            case 'material':
                return <MaterialIcons name={item.name as any} size={22} color={colors.primary || colors.text} />;
            case 'image':
                return <Image source={item.source} style={styles.rowImage} resizeMode="cover" />;
            case 'bank':
                return item.logo
                    ? <TurboImage source={{ uri: item.logo }} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    : <Ionicons name="card-outline" size={22} color={colors.primary || colors.text} />;
        }
    };

    const isImageKind = item.kind === 'image';

    return (
        <View style={styles.infoRow}>
            <View style={[
                styles.iconContainer,
                { backgroundColor: isImageKind ? colors.card : iconBg, overflow: 'hidden' }
            ]}>
                {renderIcon()}
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[styles.infoLabel, { color: colors.text }]} numberOfLines={2}>
                    {item.label}
                </Text>
                {item.sublabel ? (
                    <Text style={[styles.infoSublabel, { color: colors.muted }]} numberOfLines={1}>
                        {item.sublabel}
                    </Text>
                ) : null}
            </View>
        </View>
    );
});

export const BriefInfoSheet = memo(forwardRef<TrueSheet, BriefInfoSheetProps>(({ profile, workplaces = [], homeInfo }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();
    const backHandler = useSheetBackHandler(ref);

    const parsedMetadata = useMemo(() => {
        if (!profile?.metadata) return null;
        try {
            return typeof profile.metadata === 'string'
                ? JSON.parse(profile.metadata)
                : profile.metadata;
        } catch {
            return null;
        }
    }, [profile?.metadata]);

    const height = parsedMetadata?.height;
    const weight = parsedMetadata?.weight;
    const bankinfo = parsedMetadata?.banking;

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const sections = useMemo<Section[]>(() => {
        const result: Section[] = [];

        // Work
        if (workplaces.length > 0) {
            result.push({
                title: 'Work',
                items: workplaces.map(w => ({
                    kind: 'solar' as const,
                    icon: CaseMinimalisticBold,
                    label: `${w.position} at ${w.company_name}`,
                })),
            });
        }

        // Education
        const eduItems: InfoItem[] = [];
        if (profile?.college) eduItems.push({ kind: 'solar', icon: SquareAcademicCapBold, label: profile.college });
        if (profile?.highschool) eduItems.push({ kind: 'solar', icon: NotebookBookmarkBold, label: profile.highschool });
        if (eduItems.length > 0) result.push({ title: 'Education', items: eduItems });

        // Places
        if (homeInfo) {
            result.push({
                title: 'Places Lived',
                items: [{ kind: 'solar', icon: PointOnMapBold, label: homeInfo }],
            });
        }

        // Personal
        const personalItems: InfoItem[] = [];
        const birthdayStr = formatDate(profile?.birthday);
        if (birthdayStr) personalItems.push({ kind: 'solar', icon: CalendarBold, label: birthdayStr });
        if (profile?.gender) {
            personalItems.push({
                kind: 'solar',
                icon: profile.gender === 'male' ? MenBold : WomenBold,
                label: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1),
            });
        }
        if (height) personalItems.push({ kind: 'material', name: 'height', label: `${height} cm` });
        if (weight) personalItems.push({ kind: 'solar', icon: WeigherBold, label: `${weight} kg` });
        if (personalItems.length > 0) result.push({ title: 'Personal', items: personalItems });

        // Contact
        const contactItems: InfoItem[] = [];
        if (profile?.email) contactItems.push({ kind: 'solar', icon: LetterBold, label: profile.email });
        if (profile?.phone) contactItems.push({ kind: 'solar', icon: PhoneBold, label: profile.phone });
        if (profile?.username) contactItems.push({ kind: 'ionicons', name: 'at-circle-outline', label: `@${profile.username}` });
        if (contactItems.length > 0) result.push({ title: 'Contact', items: contactItems });

        // More
        const moreItems: InfoItem[] = [];
        if (profile?.hobby) moreItems.push({ kind: 'ionicons', name: 'extension-puzzle-outline', label: profile.hobby });
        if (profile?.talent) moreItems.push({ kind: 'ionicons', name: 'star-outline', label: profile.talent });
        if (profile?.license_plate) moreItems.push({ kind: 'solar', icon: WheelBold, label: profile.license_plate });
        const marriedStr = formatDate(profile?.married_date);
        if (marriedStr) moreItems.push({ kind: 'ionicons', name: 'heart-outline', label: `Married: ${marriedStr}` });
        if (moreItems.length > 0) result.push({ title: 'More', items: moreItems });

        // Banking
        if (bankinfo) {
            result.push({
                title: 'Banking',
                items: [{
                    kind: 'bank',
                    logo: bankinfo.logo,
                    label: `${bankinfo.recipient} · ${bankinfo.banknumber}`,
                    sublabel: bankinfo.bankname,
                }],
            });
        }

        // Family
        if (profile?.loved_ones && profile.loved_ones.length > 0) {
            result.push({
                title: 'Family',
                items: profile.loved_ones.map(person => ({
                    kind: 'image' as const,
                    source: getFamilyAvatarSource(person.label),
                    label: person.name,
                    sublabel: person.label,
                })),
            });
        }

        return result;
    }, [profile, workplaces, homeInfo, height, weight, bankinfo]);

    return (
        <TrueSheet
            ref={ref}
            scrollable={true}
            backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
            grabberOptions={{
                color: colors.muted || "#C4C4C4",
                height: 5,
                width: 40,
            }}
            onDidPresent={backHandler.onDidPresent}
            onDidDismiss={backHandler.onDidDismiss}
        >
            <ScrollView nestedScrollEnabled style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={[common.heading, { fontSize: 24 }]}>Know me</Text>
                    {profile?.name && (
                        <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                            Get to know {profile.name} better
                        </Text>
                    )}
                </View>

                {/* Sections */}
                {sections.map((section) => (
                    <View key={section.title} style={{ marginBottom: 24 }}>
                        <Text style={[common.bodySmall, styles.sectionTitle]}>
                            {section.title}
                        </Text>
                        <View style={{ gap: 4 }}>
                            {section.items.map((item, i) => (
                                <InfoRow key={i} item={item} colors={colors} />
                            ))}
                        </View>
                    </View>
                ))}

                {sections.length === 0 && (
                    <Text style={[common.bodySmall, { color: colors.muted, textAlign: 'center' }]}>
                        No information available
                    </Text>
                )}

                <View style={{ height: inset.bottom + 20 }} />
            </ScrollView>
        </TrueSheet>
    );
}));

const styles = StyleSheet.create({
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    rowImage: {
        width: 44,
        height: 44,
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    infoSublabel: {
        fontSize: 12,
        marginTop: 2,
    },
    sectionTitle: {
        fontWeight: '700',
        marginBottom: 12,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 11,
    },
});
