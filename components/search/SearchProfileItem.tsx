import VerifiedIcon from "@/icons/verified";
import { Profile } from "@/types/profile";
import { calculateAge } from "@/utils/timeandage";
import FastImage from "@d11/react-native-fast-image";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import TurboImage from "react-native-turbo-image";
import { FlexText } from "../FlexText";

interface SearchProfileItemProps {
    item: Profile;
    colors: any;
    styles: any;
    common: any;
    navigation: any;
    imageCachePolicy: any;
    onPress?: (item: Profile) => void;
}

export const SearchProfileItem = React.memo(({
    item,
    colors,
    styles,
    common,
    navigation,
    imageCachePolicy,
    onPress,
}: SearchProfileItemProps) => {
    const handlePress = () => {
        if (onPress) {
            onPress(item);
        } else {
            navigation.push({
                pathname: "/profile/[id]",
                params: { id: item.id, isMe: "false" },
            });
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.profileCard,
                { backgroundColor: colors.containerContent },
            ]}
            activeOpacity={0.7}
            onPress={handlePress}
        >
            {item.avatar_url ? <FastImage
                source={{ uri: item.avatar_url }}
                style={styles.avatar}
                resizeMode={FastImage.resizeMode.cover}
            /> : <FastImage
                source={
                    item.gender === "male"
                        ? require("../../assets/images/AV17.png")
                        : item.gender
                            ? require("../../assets/images/AV86.png")
                            : {
                                uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                            }
                }
                style={styles.avatar}
                resizeMode={FastImage.resizeMode.cover}
            />}
            <View style={styles.profileInfo}>
                <View style={[common.row, { gap: 4 }]}>
                    <FlexText
                        style={[common.subheading, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {item.name}
                    </FlexText>
                    {item.is_verified && (
                        <VerifiedIcon size={14} backgroundColor={colors.verify} />
                    )}
                </View>
                {item.username ? (
                    <FlexText
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        @{item.username}
                    </FlexText>
                ) : item.bio ? (
                    <FlexText
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        {item.bio}
                    </FlexText>
                ) : null}
                {item.birthday && (
                    <FlexText
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        {calculateAge(item.birthday)} years old
                    </FlexText>
                )}
            </View>
            <View style={[styles.viewButton, { backgroundColor: colors.card }]}>
                <FlexText style={[common.label, { color: colors.text, fontSize: 12 }]}>
                    View
                </FlexText>
            </View>
        </TouchableOpacity>
    );
});
