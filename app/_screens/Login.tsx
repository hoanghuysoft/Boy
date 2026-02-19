import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import FastImage from "@d11/react-native-fast-image";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoginViewModel } from "../../viewmodels/LoginViewModel";

const LoginScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const style = styles(colors);

    const { isSigningIn, handleGoogleLogin } = useLoginViewModel();

    return (
        <SafeAreaView style={[style.container, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>
                <View style={[common.row, { gap: 10, alignItems: "center" }]}>
                    <FastImage source={require("../../assets/images/icon.png")} style={{ width: 50, height: 50, borderRadius: 100 }} />
                    <Text style={[common.headline, { color: colors.text }]}>WeLove</Text>
                </View>
                <Text style={[common.heading, { color: colors.text, marginTop: 80, textAlign: "center" }]}>Login to your account</Text>
                <Text style={[common.body, { color: colors.text, marginTop: 10, textAlign: "center" }]}>Access to all loved one with your Google account</Text>
            </View>
            <View style={style.bottomButtonContainer}>
                <TouchableOpacity
                    onPress={handleGoogleLogin}
                    style={[common.button, { borderRadius: 9999, flexDirection: "row", gap: 10, width: "100%", justifyContent: "center", alignItems: "center" }]}
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
            <Modal
                visible={isSigningIn}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={style.modalOverlay}>
                    <View style={[style.modalContent, { backgroundColor: colors.containerContent || colors.card }]}>
                        <ActivityIndicator size="large" color={colors.text} />
                        <Text style={[common.body, { color: colors.text, marginTop: 12, textAlign: "center" }]}>Signing in...</Text>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 36,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
});