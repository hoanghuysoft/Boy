import { FProfilePhotosGrid } from '@/components/fprofile';
import { FBPhotoList } from '@/types/localfb';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

interface FProfilePhotosTabProps {
    photos: FBPhotoList | null;
    fbColors: any;
}

const FProfilePhotosTab: React.FC<FProfilePhotosTabProps> = ({
    photos,
    fbColors,
}) => {
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: fbColors.contentBg }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <FProfilePhotosGrid
                photos={photos}
                fbColors={fbColors}
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

export default FProfilePhotosTab;
