import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { SquircleView } from 'expo-squircle-view';
import React, { ForwardedRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlexText } from '../FlexText';

interface DescriptionSheetProps {
  colors: any;
  insets: any;
  detentFraction: number;
  detail: any;
  onTagPress: (tag: string) => void;
  isFullscreen?: boolean;
}

export const DescriptionSheet = React.forwardRef(({ colors, insets, detentFraction, detail, onTagPress, isFullscreen }: DescriptionSheetProps, ref: ForwardedRef<TrueSheet>) => {
  return (
    <TrueSheet
      ref={ref}
      detents={isFullscreen ? [1] : [detentFraction]}
      cornerRadius={24}
      grabber
      scrollable
      backgroundColor={colors.surface}
      dimmed={false}
    >
      <View style={{ flex: 1, paddingTop: 16 }}>
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, marginBottom: 8 }}>
          <FlexText style={{ color: colors.onSurface, fontSize: 22, fontWeight: "700", marginVertical: 12, paddingHorizontal: 12 }}>
            Description
          </FlexText>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <FlexText style={{ color: colors.onSurface, fontSize: 20, fontWeight: "700", marginBottom: 8, paddingHorizontal: 12 }}>
            {detail?.title}
          </FlexText>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16, paddingHorizontal: 12 }}>
            <SquircleView cornerSmoothing={100} preserveSmoothing style={[styles.metaCard, { backgroundColor: colors.surfaceContainerHigh }]}>
              <FlexText numberOfLines={1} style={[styles.metaValue, { color: colors.onSurface }]}>
                {detail?.views ? detail.views.replace(/ views/i, "") : "—"}
              </FlexText>
              <FlexText style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>Views</FlexText>
            </SquircleView>

            {(() => {
              const uploaded = detail?.uploaded;
              if (!uploaded) return null;
              const match = uploaded.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})/);
              let date = "—", year = "—";
              if (match) {
                const [_, day, month, y] = match;
                date = `${day} ${month.slice(0, 3)}`;
                year = y.length === 2 ? `20${y}` : y;
              } else {
                const matchSlash = uploaded.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (matchSlash) {
                  const [_, day, month, y] = matchSlash;
                  date = `${day}/${month}`;
                  year = y;
                } else {
                  date = uploaded;
                  year = "Ago";
                }
              }
              return (
                <SquircleView cornerSmoothing={100} preserveSmoothing style={[styles.metaCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <FlexText numberOfLines={1} style={[styles.metaValue, { color: colors.onSurface }]}>
                    {date}
                  </FlexText>
                  <FlexText style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>{year}</FlexText>
                </SquircleView>
              );
            })()}

            <SquircleView cornerSmoothing={60} preserveSmoothing style={[styles.metaCard, { backgroundColor: colors.surfaceContainerHigh }]}>
              <FlexText numberOfLines={1} style={[styles.metaValue, { color: colors.onSurface }]}>
                {detail?.category || "—"}
              </FlexText>
              <FlexText style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>Category</FlexText>
            </SquircleView>
          </View>

          {/* Tags section */}
          {!!detail?.tags && detail.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              style={{ marginVertical: 8 }}
            >
              {detail.tags.map((tag: string, index: number) => (
                <TouchableOpacity
                  key={`${tag}-${index}`}
                  onPress={() => onTagPress(tag)}
                  style={[styles.tagPill, { backgroundColor: colors.surfaceContainerHigh }]}
                >
                  <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: "500" }}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <SquircleView cornerSmoothing={100} preserveSmoothing style={[styles.descBox, { backgroundColor: colors.surfaceContainerHigh, marginHorizontal: 12, marginTop: 12 }]}>
            <FlexText style={{ color: colors.onSurface, fontSize: 15, lineHeight: 22 }}>
              {detail?.description || "No description available."}
            </FlexText>
          </SquircleView>
        </ScrollView>
      </View>
    </TrueSheet>
  );
});

DescriptionSheet.displayName = "DescriptionSheet";

const styles = StyleSheet.create({
  metaCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    height: 70,
  },
  metaValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  metaLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  descBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
});
