import { FlexText } from "@/components/FlexText";
import { useStatusBar } from "@/context/StatusBarContext";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import { useProfile } from "@/services/userprofile";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ClapperboardBold, TvBold } from "@solar-icons/react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DashboardScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { data: profile } = useProfile("me", true);
    const insets = useSafeAreaInsets();
    const statusBar = useStatusBar();
    const { t } = useTranslation();

    // Disable the status bar fade only while this screen is focused.
    // Using useFocusEffect (instead of useEffect) ensures we also re-enable
    // the fade when the user navigates to another tab/screen, even if this
    // screen stays mounted in the background.
    useFocusEffect(
        useCallback(() => {
            statusBar.setShowStatusBarFade(false);
            return () => {
                statusBar.setShowStatusBarFade(true);
            };
        }, [statusBar]),
    );
    return (
        <View style={[common.screen, { gap: 12 }]}>
            <View style={{ height: 200, width: '100%', backgroundColor: colors.containerContent }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, paddingTop: insets.top + 50 }}>
                    <Image source={{ uri: profile?.avatar_url }} style={{
                        width: 64, height: 64, borderRadius: 8,
                    }} />
                    <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'flex-start', height: 64 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlexText style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{profile?.name} </FlexText>
                            {profile?.is_verified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                        </View>
                        <FlexText style={{ fontSize: 16, color: colors.muted }}>{profile?.username || profile?.email}</FlexText>
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/profile/${profile?.id}?isMe=false`)}>
                        <Ionicons name="chevron-forward" size={24} color={colors.muted} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ width: '100%', backgroundColor: colors.containerContent, padding: 16, gap: 12 }}>
                <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.muted, marginBottom: 8 }}>
                    {t('dashboard.sections.services')}
                </FlexText>
                <TouchableOpacity onPress={() => router.push("/webview?url=https://reclipnew.onrender.com/")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8}}>
                    <Image source={{ uri: 'https://wsrv.nl/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQma91KiDAvy7QPj6c7a9nmNEUkTarx43vjnqJRYvu3VjU1&w=256&h=undefined&q=75&ll=&default=https%3A%2F%2Fipfs.io%2Fipfs%2FQma91KiDAvy7QPj6c7a9nmNEUkTarx43vjnqJRYvu3VjU1&output=webp' }} style={{ width: 28, height: 28, borderRadius: 8 }} />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>ReClip</FlexText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/webview?url=https://onflix.my/&isUseSafeArea=true&safeAreaColor=black&isShowBackButton=false")} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8}}>
                    <Image source={{ uri: 'https://onflix.my/app/asset/logo.png' }} style={{ width: 28, height: 28, borderRadius: 8 }} contentFit="contain" />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>OnFlix</FlexText>
                </TouchableOpacity>
            </View>

            <View style={{ width: '100%', backgroundColor: colors.containerContent, padding: 16, gap: 12 }}>
                <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.muted, marginBottom: 8 }}>
                    {t('dashboard.sections.entertainment')}
                </FlexText>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8}}>
                    <TvBold size={28} color={colors.text} />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>WeLoveTV</FlexText>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8}}>
                    <ClapperboardBold size={28} color={colors.text} />
                    <FlexText style={{ fontSize: 16, color: colors.text }}>Movies & TV</FlexText>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default DashboardScreen;