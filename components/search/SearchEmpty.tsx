import React from "react";
import { Text, View } from "react-native";

interface SearchEmptyProps {
    colors: any;
    styles: any;
    common: any;
    searchQuery: string;
    isAdmin?: boolean;
}

export const renderEmptyState = ({ colors, styles, common, searchQuery, isAdmin = false }: SearchEmptyProps) => (
    <View style={styles.emptyState}>
        <Text
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
        </Text>
        <Text
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
        </Text>
    </View>
);