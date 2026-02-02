
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import TurboImage from "react-native-turbo-image";

interface QuickPreviewModalProps {
    visible: boolean;
    imageUrl: string | null;
    onClose: () => void;
}

const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
    visible,
    imageUrl,
    onClose,
}) => {
    const [mounted, setMounted] = useState(visible);

    useEffect(() => {
        if (visible) {
            setMounted(true);
        } else {
            setMounted(false);
        }
    }, [visible]);


    return (
        <Modal
            visible={mounted}
            animationType="fade"
            onRequestClose={onClose}
            backdropColor={"#000000e1"}
        >
            <View style={styles.container}>
                <TurboImage
                    source={{ uri: imageUrl || "" }}
                    style={styles.image}
                    resizeMode="contain"
                />

            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 1)",
    },
    contentWrapper: {
        alignItems: "center",
    },
    image: {
        width: "100%",
        height: "100%",
    },

});

export default QuickPreviewModal;
