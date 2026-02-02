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

            {/* Username */}
            {profile?.username && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Username</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            @{profile.username}
                        </Text>
                        <Ionicons name="at-circle-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* License Plate */}
            {profile?.license_plate && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>License Plate</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.license_plate}
                        </Text>
                        <Ionicons name="card-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Married Date */}
            {profile?.married_date && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Married Date</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {formatBirthday(profile.married_date)}
                        </Text>
                        <Ionicons name="heart-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Hobby */}
            {profile?.hobby && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Hobby</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.hobby}
                        </Text>
                        <Ionicons name="extension-puzzle-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Talent */}
            {profile?.talent && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Talent</Text>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <Text style={[common.body, { textAlign: 'justify', flex: 1 }]}>
                            {profile.talent}
                        </Text>
                        <Ionicons name="star-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Loved Ones */}
            {profile?.loved_ones && profile.loved_ones.length > 0 && (
                <>
                    <View style={common.divider} />
                    <Text style={[common.muted]}>Loved Ones</Text>
                    <View style={{ gap: 4, marginTop: 4 }}>
                        {profile.loved_ones.map((person, index) => (
                            <View key={index} style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                                <Text style={[common.body, { flex: 1 }]}>
                                    <Text style={{ fontWeight: '600' }}>{person.label}:</Text> {person.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* Show message if no info available */}
            {!profile?.gender && !profile?.birthday && !profile?.hometown && !profile?.college && !profile?.highschool && !profile?.username && !profile?.hobby && !profile?.talent && !profile?.license_plate && !profile?.married_date && !profile?.loved_ones?.length && (
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