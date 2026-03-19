import React from "react";
import { View } from "react-native";
import { FlexText } from "../FlexText";

interface SearchEmptyProps {
    colors: any;
    styles: any;
    common: any;
    searchQuery: string;
    isAdmin?: boolean;
}

export const renderEmptyState = ({ colors, styles, common, searchQuery, isAdmin = false }: SearchEmptyProps) => (
    <View style={styles.emptyState}>
        <FlexText
            style={[
                common.heading,
                { color: colors.muted, textAlign: "center", marginTop: 16 },
            ]}
        >
            {searchQuery
                ? "No results found"
                : isAdmin
                    ? "No people yet"
                    : "Search for people"}
        </FlexText>
        <FlexText
            style={[
                common.bodySmall,
                {
                    color: colors.muted,
                    textAlign: "center",
                    marginTop: 8,
                    opacity: 0.7,
                },
            ]}
        >
            {searchQuery
                ? `No profiles match "${searchQuery}"`
                : isAdmin
                    ? "No profiles available"
                    : "Type a name to find people"}
        </FlexText>
    </View>
);