import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { EMOJI_ASSETS, EMOJI_NAMES } from '../utils/emojiResolver';
import { FlexText } from './FlexText';

interface EmojiSelectorSheetProps {
    onSelect: (emojiName: string) => void;
    theme: 'light' | 'dark';
    colors: any;
    onDismiss?: () => void;
}

export const EmojiSelectorSheet = forwardRef<TrueSheet, EmojiSelectorSheetProps>(
    ({ onSelect, theme, colors, onDismiss }, ref) => {
        const [isScrolling, setIsScrolling] = useState(false);

        const onScrollBeginDrag = useCallback(() => {
            setIsScrolling(true);
        }, []);

        const onScrollEndDrag = useCallback((event: any) => {
            if (!event.nativeEvent.decelerating) {
                setIsScrolling(false);
            }
        }, []);

        const onMomentumScrollBegin = useCallback(() => {
            setIsScrolling(true);
        }, []);

        const onMomentumScrollEnd = useCallback(() => {
            setIsScrolling(false);
        }, []);

        const renderItem = useCallback(({ item }: { item: string }) => {
            return (
                <TouchableOpacity
                    style={styles.emojiItem}
                    onPress={() => onSelect(item)}
                >
                    <Image
                        source={EMOJI_ASSETS[item]}
                        style={styles.emojiImage}
                        contentFit="cover"
                        autoplay={!isScrolling}
                    />
                </TouchableOpacity>
            );
        }, [onSelect, isScrolling]);

        return (
            <TrueSheet
                ref={ref}
                scrollable
                detents={[1]}
                cornerRadius={32}
                backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
                grabberOptions={{ color: colors.muted || '#C4C4C4', height: 5, width: 40 }}
                onDidDismiss={onDismiss}
            >
                <View style={styles.header}>
                    <FlexText style={[{ fontSize: 20, color: colors.text, fontWeight: 'bold' }]}>月薪喵</FlexText>
                </View>
                <FlatList
                    data={EMOJI_NAMES}
                    keyExtractor={(item) => item}
                    renderItem={renderItem}
                    numColumns={4}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={onScrollBeginDrag}
                    onScrollEndDrag={onScrollEndDrag}
                    onMomentumScrollBegin={onMomentumScrollBegin}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    windowSize={3}
                    initialNumToRender={24}
                    maxToRenderPerBatch={24}
                    removeClippedSubviews={true}
                />
            </TrueSheet>
        );
    }
);

EmojiSelectorSheet.displayName = 'EmojiSelectorSheet';

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 4,
        gap: 10,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    emojiItem: {
        width: '22%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderRadius: 12,
    },
    emojiImage: {
        width: '80%',
        height: '80%',
    },
});
