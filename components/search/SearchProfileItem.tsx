import VerifiedIcon from "@/icons/verified";
import { Profile } from "@/types/profile";
import { calculateAge } from "@/utils/timeandage";
import { SquircleView } from "expo-squircle-view";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";
import { FlexText } from "../FlexText";

interface SearchProfileItemProps {
    item: Profile;
    colors: any;
    styles: any;
    common: any;
    navigation: any;
    onPress?: (item: Profile) => void;
}

export const SearchProfileItem = React.memo(({
    item,
    colors,
    styles,
    common,
    navigation,
    onPress,
}: SearchProfileItemProps) => {
    const { t } = useTranslation();

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
        <SquircleView
            cornerSmoothing={60}
            borderRadius={9999}
            style={{ backgroundColor: colors.containerContent }}
        >
            <TouchableOpacity
                style={[styles.profileCard]}
                activeOpacity={0.7}
                onPress={handlePress}
            >
                {item.avatar_url ?
                    <View style={[styles.avatar, { overflow: "hidden" }]}>
                        <NitroImage
                            image={{ url: item.avatar_url }}
                            style={styles.avatar}
                            resizeMode={"cover"}
                        />
                    </View> :
                    <View style={[styles.avatar, { overflow: "hidden" }]}>
                        <NitroImage
                            image={
                                item.gender === "male"
                                    ? require("../../assets/images/AV17.png")
                                    : item.gender
                                        ? require("../../assets/images/AV86.png")
                                        : {
                                            url: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                        }
                            }
                            style={styles.avatar}
                            resizeMode={"cover"}
                        />
                    </View>
                }
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
                            {t('search.profile.yearsOld', { count: calculateAge(item.birthday) })}
                        </FlexText>
                    )}
                </View>
                <View style={[styles.viewButton, { backgroundColor: colors.card }]}>
                    <FlexText style={[common.label, { color: colors.text, fontSize: 12 }]}>
                        {t('search.profile.view')}
                    </FlexText>
                </View>
            </TouchableOpacity>
        </SquircleView>
    );
});
