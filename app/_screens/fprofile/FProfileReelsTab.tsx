import { FProfileReelsGrid } from '@/components/fprofile';
import { FBVideoList } from '@/types/localfb';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

interface FProfileReelsTabProps {
    videos: FBVideoList | null;
    fbColors: any;
    formatDuration: (seconds: number) => string;
    formatCount: (count: number) => string;
}

const FProfileReelsTab: React.FC<FProfileReelsTabProps> = ({
    videos,
    fbColors,
    formatDuration,
    formatCount,
}) => {
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: fbColors.contentBg }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <FProfileReelsGrid
                videos={videos}
                fbColors={fbColors}
                formatDuration={formatDuration}
                formatCount={formatCount}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 80,
    },
});

export default FProfileReelsTab;
