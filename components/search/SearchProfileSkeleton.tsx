import React from "react";
import { View } from "react-native";
import { ShimmerEffect } from "../shimmer/Shimmer";
import { CustomSurface } from "../CustomSurface";

export const renderProfileSkeleton = ({ colors, styles, isFirst, isLast }: any) => (
    <CustomSurface
        isFirst={isFirst}
        isLast={isLast}
        style={styles.profileCard}
    >
        <ShimmerEffect
            isLoading={true}
            style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.divider,
            }}
        />
        <View style={styles.profileInfo}>
            <ShimmerEffect
                isLoading={true}
                style={{
                    width: 140,
                    height: 18,
                    borderRadius: 8,
                    backgroundColor: colors.divider,
                }}
            />
            <ShimmerEffect
                isLoading={true}
                style={{
                    width: 100,
                    height: 14,
                    borderRadius: 6,
                    marginTop: 6,
                    backgroundColor: colors.divider,
                }}
            />
        </View>
        <ShimmerEffect
            isLoading={true}
            style={{
                width: 50,
                height: 28,
                borderRadius: 999,
                backgroundColor: colors.divider,
            }}
        />
    </CustomSurface>
);