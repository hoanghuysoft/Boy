import { FProfileHighlights, FProfilePersonalInfo, FProfilePostList } from '@/components/fprofile';
import { LocalFBData } from '@/services/localfb';
import { Profile } from '@/types/profile';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface FProfileAllTabProps {
    profile: Profile | null;
    fbData: LocalFBData;
    fbColors: any;
    formatBirthday: (dateString: string | null) => string | null;
    formatTimestamp: (timestamp: number) => string;
}

const FProfileAllTab: React.FC<FProfileAllTabProps> = ({
    profile,
    fbData,
    fbColors,
    formatBirthday,
    formatTimestamp,
}) => {
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: fbColors.contentBg }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Personal Details */}
            <FProfilePersonalInfo
                profile={profile}
                fbColors={fbColors}
                formatBirthday={formatBirthday}
            />

            {/* Highlights */}
            <FProfileHighlights
                highlights={fbData.highlights}
                fbColors={fbColors}
            />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: fbColors.divider }]} />

            {/* Posts */}
            <FProfilePostList
                posts={fbData.posts}
                fbColors={fbColors}
                formatTimestamp={formatTimestamp}
            />

            <View style={{ height: 80 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    divider: {
        height: 8,
        marginTop: 20,
    },
});

export default FProfileAllTab;
