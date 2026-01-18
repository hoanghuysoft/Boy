import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import BlurView from "@sbaiahmed1/react-native-blur";
import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from "react-native";

const OptionModal = ({ modalVisible, setModalVisible }: { modalVisible: boolean, setModalVisible: (visible: boolean) => void }) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    return (
        <Modal
            visible={modalVisible}
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
            animationType="fade"
        >
            <Pressable style={styles.modalContainer} onPress={() => setModalVisible(false)}>
                <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
                    <BlurView blurAmount={theme === "dark" ? 80 : 100} blurType={theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"} style={styles.blurView}>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={common.label}>Demo1aaaaaaaaa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={common.label}>Demo2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={common.label}>Demo3</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => { router.push('/settings'); setModalVisible(false) }}>
                            <Text style={common.label}>Settings</Text>
                        </TouchableOpacity>
                    </BlurView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalContent: {
        position: 'absolute',
        top: 50,
        right: 16,
    },
    blurView: {
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        gap: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalButton: {
        marginTop: 10,
    },
    modalButtonText: {
        color: 'white',
    },
});

export default OptionModal;
