import { Profile } from '@/types/profile';
import { Calendar, HeartPulse2, Mailbox, Men, NotebookBookmark, Phone, SquareAcademicCap, Wheel, Women } from "@solar-icons/react-native/Bold";
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlexText } from '../FlexText';
import CachedImage from './CachedImage';

// Random placeholder avatars for family members
const RANDOM_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop',
];

interface FProfilePersonalInfoProps {
    profile: Profile | null;
    fbColors: any;
    formatBirthday: (dateString: string | null) => string | null;
}

const FProfilePersonalInfo: React.FC<FProfilePersonalInfoProps> = ({
    profile,
    fbColors,
    formatBirthday,
}) => {
    if (!profile) return null;

    const details: { icon: React.ComponentType<any>; label: string }[] = [];

    if (profile.college) {
        details.push({ icon: SquareAcademicCap, label: profile.college });
    }
    if (profile.highschool) {
        details.push({ icon: NotebookBookmark, label: profile.highschool });
    }
    if (profile.birthday) {
        details.push({
            icon: Calendar,
            label: formatBirthday(profile.birthday) || profile.birthday,
        });
    }
    if (profile.gender) {
        details.push({
            icon: profile.gender === 'male' ? Men : Women,
            label: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1),
        });
    }
    if (profile.email) {
        details.push({ icon: Mailbox, label: profile.email });
    }
    if (profile.phone) {
        details.push({ icon: Phone, label: profile.phone });
    }
    if (profile.license_plate) {
        details.push({ icon: Wheel, label: profile.license_plate });
    }

    // Family members
    const familyMembers = profile.loved_ones || [];

    return (
        <View style={styles.container}>
            <FlexText style={[styles.sectionTitle, { color: fbColors.primaryText }]}>
                Personal details
            </FlexText>
            <View style={styles.detailsList}>
                {details.map((detail, index) => (
                    <View key={index} style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                            <detail.icon size={24} color={fbColors.iconColor} />
                        </View>
                        <FlexText
                            style={[styles.detailLabel, { color: fbColors.primaryText }]}
                            numberOfLines={3}
                        >
                            {detail.label}
                        </FlexText>
                    </View>
                ))}

                {/* Family Members with stacked avatars */}
                {familyMembers.length > 0 && (
                    <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                            <HeartPulse2
                                size={24}
                                color={fbColors.iconColor}
                            />
                        </View>
                        <View style={styles.familyContent}>
                            <FlexText style={[styles.detailLabel, { color: fbColors.primaryText }]}>
                                Family
                            </FlexText>
                            <View style={styles.familyRow}>
                                {/* Stacked Avatars */}
                                <View style={styles.stackedAvatars}>
                                    {familyMembers.slice(0, 4).map((_, i) => (
                                        <CachedImage
                                            key={i}
                                            uri={RANDOM_AVATARS[i % RANDOM_AVATARS.length]}
                                            style={[
                                                styles.familyAvatar,
                                                {
                                                    borderColor: fbColors.contentBg || '#FFF',
                                                    marginLeft: i === 0 ? 0 : -8,
                                                    zIndex: familyMembers.length - i,
                                                },
                                            ]}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </View>
                                <FlexText style={[styles.familyCountText, { color: fbColors.secondaryText }]}>
                                    {familyMembers.length} family member{familyMembers.length > 1 ? 's' : ''}
                                </FlexText>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <TouchableOpacity activeOpacity={0.7}>
                <FlexText style={[styles.seeMoreText, { color: fbColors.primaryText }]}>
                    See more details
                </FlexText>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 16,
    },
    detailsList: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    detailIconContainer: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailLabel: {
        fontSize: 15,
        flex: 1,
        marginTop: 2,
    },
    familyContent: {
        flex: 1,
    },
    familyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    stackedAvatars: {
        flexDirection: 'row',
    },
    familyAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    familyCountText: {
        fontSize: 14,
    },
    seeMoreText: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 20,
    },
});

export default FProfilePersonalInfo;
