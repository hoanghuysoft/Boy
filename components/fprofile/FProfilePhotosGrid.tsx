import { FBPhotoList } from '@/types/localfb';
import { Ionicons } from '@expo/vector-icons';
import { Galeria } from '@nandorojo/galeria';
import React, { memo } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import CachedImage from './CachedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_COLUMNS = 3;
const PHOTO_GAP = 2;
const PHOTO_SIZE = (SCREEN_WIDTH - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS;

interface FProfilePhotosGridProps {
    photos: FBPhotoList | null;
    fbColors: any;
}

const FProfilePhotosGrid: React.FC<FProfilePhotosGridProps> = ({
    photos,
    fbColors,
}) => {
    if (!photos || photos.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={fbColors.secondaryText} />
                <Text style={[styles.emptyText, { color: fbColors.secondaryText }]}>
                    No photos available
                </Text>
            </View>
        );
    }

    const photoUrls = photos.map((p) => p.image || p.thumbnail);

    return (
        <View style={styles.container}>
            <Galeria urls={photoUrls}>
                <View style={styles.grid}>
                    {/* {photos.map((photo, index) => (
                        <Galeria.Image index={index} key={photo.id}>
                            <CachedImage
                                uri={photo.thumbnail}
                                style={styles.photoItem}
                                resizeMode="cover"
                            />
                        </Galeria.Image>
                    ))} */}
                    {photos.map((photo, index) => (
                        <Galeria.Image index={index} key={photo.id}>
                            <CachedImage
                                uri={photo.thumbnail}
                                style={styles.photoItem}
                                resizeMode="cover"
                            />
                        </Galeria.Image>
                    ))}
                </View>
            </Galeria>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: PHOTO_GAP,
    },
    photoItem: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        marginBottom: 1,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
    },
});

export default memo(FProfilePhotosGrid);
