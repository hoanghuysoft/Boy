import VerifiedIcon from "@/icons/verified";
import { Profile } from "@/types/profile";
import { calculateAge } from "@/utils/timeandage";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import TurboImage from "react-native-turbo-image";

interface SearchProfileItemProps {
    item: Profile;
    colors: any;
    styles: any;
    common: any;
    navigation: any;
    imageCachePolicy: any;
}

export const SearchProfileItem = React.memo(({
    item,
    colors,
    styles,
    common,
    navigation,
    imageCachePolicy
}: SearchProfileItemProps) => {
    return (
        <TouchableOpacity
            style={[
                styles.profileCard,
                { backgroundColor: colors.containerContent },
            ]}
            activeOpacity={0.7}
            onPress={() =>
                navigation.push({
                    pathname: "/profile/[id]",
                    params: { id: item.id, isMe: "false" },
                })
            }
        >
            <TurboImage
                source={{
                    uri:
                        item.avatar_url ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                style={styles.avatar}
                resizeMode="cover"
                cachePolicy={imageCachePolicy}
                fadeDuration={100}
            />
            <View style={styles.profileInfo}>
                <View style={[common.row, { gap: 4 }]}>
                    <Text
                        style={[common.subheading, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>
                    {item.is_verified && (
                        <VerifiedIcon size={14} backgroundColor={colors.verify} />
                    )}
                </View>
                {item.username ? (
                    <Text
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        @{item.username}
                    </Text>
                ) : item.bio ? (
                    <Text
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        {item.bio}
                    </Text>
                ) : null}
                {item.birthday && (
                    <Text
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        {calculateAge(item.birthday)} years old
                    </Text>
                )}
            </View>
            <View style={[styles.viewButton, { backgroundColor: colors.card }]}>
                <Text style={[common.label, { color: colors.text, fontSize: 12 }]}>
                    View
                </Text>
            </View>
        </TouchableOpacity>
    );
});
