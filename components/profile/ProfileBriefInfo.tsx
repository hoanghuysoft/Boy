import { CaseMinimalisticBold, NotebookBookmarkBold, PointOnMapBold, SquareAcademicCapBold } from '@solar-icons/react-native';
import React from 'react';
import { ScrollView, Text, View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { ProfileDetail } from "../../types/profiledetail";
import { Workplace } from "../../types/profileworplace";

interface ProfileBriefInfoProps {
    profile?: ProfileDetail | null;
    workplaces?: Workplace[];
    homeInfo?: string | null;
}

const ProfileBriefInfo: React.FC<ProfileBriefInfoProps> = ({ profile, workplaces = [], homeInfo }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    const getRelationshipEmoji = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('father') || l.includes('dad')) return '👨';
        if (l.includes('mother') || l.includes('mom')) return '👩';
        if (l.includes('brother')) return '👦';
        if (l.includes('sister')) return '👧';
        if (l.includes('son')) return '👦';
        if (l.includes('daughter')) return '👧';
        if (l.includes('wife') || l.includes('husband') || l.includes('partner') || l.includes('married')) return '💍';
        return '❤️';
    };

    const workItems: any[] = [];
    if (workplaces.length > 0) {
        workItems.push({
            solarIcon: CaseMinimalisticBold,
            label: `${workplaces[0].position} at ${workplaces[0].company_name}`
        });
    }

    const eduItems: any[] = [];
    if (profile?.college) eduItems.push({ solarIcon: SquareAcademicCapBold, label: profile.college });
    if (profile?.highschool) eduItems.push({ solarIcon: NotebookBookmarkBold, label: profile.highschool });

    // Hometown/Address
    const homeItems: any[] = [];
    if (homeInfo) homeItems.push({ solarIcon: PointOnMapBold, label: homeInfo });

    const relItems: any[] = [];
    if (profile?.loved_ones && profile.loved_ones.length > 0) {
        profile.loved_ones.forEach(person => {
            relItems.push({
                emoji: getRelationshipEmoji(person.label),
                label: `${person.label} - ${person.name}`
            });
        });
    }

    if (!workItems.length && !eduItems.length && !homeItems.length && !relItems.length) return null;

    const Section = ({ title, items }: { title: string, items: any[] }) => {
        if (items.length === 0) return null;
        return (
            <View style={{ marginBottom: 16 }}>
                <Text style={[common.bodySmall, { fontWeight: '700', marginBottom: 8, opacity: 0.8 }]}>{title}</Text>
                <View style={{ gap: 8 }}>
                    {items.map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {item.solarIcon ? (
                                <item.solarIcon size={18} color={colors.text} style={{ marginRight: 10, width: 20 }} />
                            ) : (
                                <Text style={{ fontSize: 14, marginRight: 10, width: 20, textAlign: 'center' }}>{item.emoji}</Text>
                            )}
                            <Text style={[common.bodySmall, { fontSize: 14, flex: 1 }]} numberOfLines={2}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={{ paddingTop: 16 }}>
            <Section title="Work" items={workItems} />
            <Section title="Education" items={eduItems} />
            <Section title="Places Lived" items={homeItems} />

            {relItems.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                    <Text style={[common.bodySmall, { fontWeight: '700', marginBottom: 8, opacity: 0.8 }]}>Family & Relationships</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                        {relItems.map((item, i) => (
                            <View key={i} style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.card,
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 20,
                                marginRight: 8
                            }}>
                                <Text style={{ fontSize: 13, marginRight: 6 }}>{item.emoji}</Text>
                                <Text style={[common.bodySmall, { fontSize: 13 }]}>{item.label}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default ProfileBriefInfo;
