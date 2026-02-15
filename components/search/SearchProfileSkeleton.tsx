import React from "react";
import { View } from "react-native";
import { ShimmerEffect } from "../shimmer/Shimmer";

export const renderProfileSkeleton = ({ colors, styles }: any) => (
    <View style={[styles.profileCard, { backgroundColor: colors.containerContent }]}>
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
    </View>
);