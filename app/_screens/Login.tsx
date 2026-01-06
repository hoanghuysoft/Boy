import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import FastImage from "@d11/react-native-fast-image";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithGoogle } from "../../services/login";

const LoginScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const style = styles(colors);
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.warn("Google login error", error);
        }
    };

    return (
        <SafeAreaView style={[style.container, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>
                <View style={[common.row, { gap: 10 }]}>
                    <FastImage source={require("../../assets/images/icon.png")} style={{ width: 50, height: 50, borderRadius: 100 }} />
                    <Text style={[common.headline, { color: colors.text }]}>BOY</Text>
                </View>
                <Text style={[common.heading, { color: colors.text, marginTop: 80 }]}>Login to your account</Text>
                <Text style={[common.body, { color: colors.text, marginTop: 10 }]}>Access to all boys with your Google account</Text>
            </View>
            <View style={style.bottomButtonContainer}>
                <TouchableOpacity
                    onPress={handleGoogleLogin}
                    style={[common.button, { borderRadius: 9999, flexDirection: "row", gap: 10, width: "100%" }]}
                >
                    <FastImage
                        resizeMode="contain"
                        source={{
                            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/960px-Google_Favicon_2025.svg.png",
                        }}
                        style={{ width: 25, height: 30 }}
                    />
                    <Text style={[common.buttonText, { color: colors.text }]}>Login with Google</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;

const styles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
    },
    bottomButtonContainer: {
        width: "100%",
        paddingHorizontal: 24,
        paddingBottom: 32,
        alignItems: "center",
        justifyContent: "flex-end",
    },
});