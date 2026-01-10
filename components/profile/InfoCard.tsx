import { Ionicons } from '@expo/vector-icons';
import { CalendarDaysSolid, MapMarker1Solid, Message2Solid, PhoneSolid, User4Solid } from '@lineiconshq/free-icons';
import Lineicons from '@lineiconshq/react-native-lineicons';
import React from 'react';
import { Text, View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { ProfileDetail } from "../../types/profiledetail";

interface InfoCardProps {
    profile?: ProfileDetail | null;
}

const InfoCard: React.FC<InfoCardProps> = ({ profile }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // Format birthday
    const formatBirthday = (dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <View style={[common.card, { marginTop: 16, marginHorizontal: 16 }]}>
            {/* Name */}
            <Text style={[common.muted]}>Name</Text>
            <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                    {profile?.name || "Not specified"}
                </Text>
            </View>

            {/* Email */}
            {profile?.email && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Email</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.email}
                        </Text>
                        <Lineicons size={22} color={colors.text} icon={Message2Solid} strokeWidth={4} />
                    </View>
                </>
            )}

            {profile?.phone && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Phone</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.phone}
                        </Text>
                        <Lineicons size={22} color={colors.text} icon={PhoneSolid} strokeWidth={4} />
                    </View>
                </>
            )}

            {/* Gender */}
            {profile?.gender && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Gender</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', textTransform: 'capitalize' }]}>
                            {profile.gender}
                        </Text>
                        <Lineicons size={22} color={colors.text} icon={User4Solid} strokeWidth={4} />
                    </View>
                </>
            )}

            {/* Birthday */}
            {profile?.birthday && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Birthday</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {formatBirthday(profile.birthday)}
                        </Text>
                        <Lineicons size={22} color={colors.text} icon={CalendarDaysSolid} strokeWidth={4} />
                    </View>
                </>
            )}

            {/* Hometown */}
            {profile?.hometown && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Hometown</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.hometown}
                        </Text>
                        <Lineicons size={22} color={colors.text} icon={MapMarker1Solid} strokeWidth={4} />
                    </View>
                </>
            )}

            {/* Education - College */}
            {profile?.college && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>College</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.college}
                        </Text>
                        <Ionicons name="school" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Education - High School */}
            {profile?.highschool && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>High School</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.highschool}
                        </Text>
                        <Ionicons name="school-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Show message if no info available */}
            {!profile?.gender && !profile?.birthday && !profile?.hometown && !profile?.college && !profile?.highschool && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted, { textAlign: 'center', marginTop: 8 }]}>
                        No additional information available
                    </Text>
                </>
            )}
        </View>
    )
}

export default InfoCard;