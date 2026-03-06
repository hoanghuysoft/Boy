import { FBHighlightList } from '@/types/localfb';
import { SquircleView } from 'expo-squircle-view';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import CachedImage from './CachedImage';

const HIGHLIGHT_SIZE = 80;

interface FProfileHighlightsProps {
    highlights: FBHighlightList | null;
    fbColors: any;
}

const FProfileHighlights: React.FC<FProfileHighlightsProps> = ({
    highlights,
    fbColors,
}) => {
    if (!highlights || highlights.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: fbColors.primaryText }]}>
                Highlights
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {highlights.map((item) => (
                    <View key={item.id} style={styles.highlightItem}>
                        <SquircleView
                            cornerSmoothing={100}
                            preserveSmoothing
                            borderRadius={12}
                            style={[styles.highlightSquircle, { backgroundColor: fbColors.cardBg }]}
                        >
                            <CachedImage
                                uri={item.thumbnail}
                                style={styles.highlightImage}
                                resizeMode="cover"
                            />
                        </SquircleView>
                        <Text
                            style={[styles.highlightTitle, { color: fbColors.primaryText }]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text style={[styles.highlightCount, { color: fbColors.secondaryText }]}>
                            {item.count} items
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    highlightItem: {
        alignItems: 'center',
        width: HIGHLIGHT_SIZE + 8,
    },
    highlightSquircle: {
        width: HIGHLIGHT_SIZE + 10,
        height: HIGHLIGHT_SIZE + 80,
        overflow: 'hidden',
    },
    highlightImage: {
        width: HIGHLIGHT_SIZE + 10,
        height: HIGHLIGHT_SIZE + 80,
    },
    highlightTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center',
    },
    highlightCount: {
        fontSize: 11,
        marginTop: 2,
    },
});

export default FProfileHighlights;
