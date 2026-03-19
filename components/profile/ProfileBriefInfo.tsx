import { CaseMinimalisticBold, NotebookBookmarkBold, PointOnMapBold, SquareAcademicCapBold } from '@solar-icons/react-native';
import React from 'react';
import { View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { ProfileDetail } from "../../types/profiledetail";
import { Workplace } from "../../types/profileworplace";
import { FlexText } from '../FlexText';

interface ProfileBriefInfoProps {
    profile?: ProfileDetail | null;
    workplaces?: Workplace[];
    homeInfo?: string | null;
}

const ProfileBriefInfo: React.FC<ProfileBriefInfoProps> = ({ profile, workplaces = [], homeInfo }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

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

    if (!workItems.length && !eduItems.length && !homeItems.length) return null;

    const Section = ({ title, items }: { title: string, items: any[] }) => {
        if (items.length === 0) return null;
        return (
            <View style={{ marginBottom: 16 }}>
                <FlexText style={[common.bodySmall, { fontWeight: '700', marginBottom: 8, opacity: 0.8 }]}>{title}</FlexText>
                <View style={{ gap: 8 }}>
                    {items.map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {item.solarIcon ? (
                                <item.solarIcon size={18} color={colors.text} style={{ marginRight: 10, width: 20 }} />
                            ) : (
                                <FlexText style={{ fontSize: 14, marginRight: 10, width: 20, textAlign: 'center' }}>{item.emoji}</FlexText>
                            )}
                            <FlexText style={[{ fontSize: 14, fontWeight: '600', flexShrink: 1 }]} numberOfLines={2}>{item.label}</FlexText>
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
        </View>
    );
};

export default ProfileBriefInfo;
