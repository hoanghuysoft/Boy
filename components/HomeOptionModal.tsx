import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
                    <View style={[styles.blurView, { backgroundColor: colors.containerContent }]}>
                        <TouchableOpacity style={styles.modalButton} onPress={() => { router.push('/settings'); setModalVisible(false) }}>
                            <Text style={common.label}>Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={common.label}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={common.label}>Terms of Service</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                            <Text style={common.label}>Help & Support</Text>
                        </TouchableOpacity>
                    </View>
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
