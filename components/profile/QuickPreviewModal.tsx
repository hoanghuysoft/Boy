
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

interface QuickPreviewModalProps {
    visible: boolean;
    imageUrl: string | null;
    blurhash: string | null | undefined;
    onClose: () => void;
}

const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
    visible,
    imageUrl,
    blurhash,
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
                <Image
                    source={{ uri: imageUrl || "" }}
                    style={styles.image}
                    contentFit="contain"
                    transition={150}
                    placeholder={
                        typeof blurhash === 'string' && blurhash.trim().length > 0
                            ? { blurhash: blurhash.trim() }
                            : undefined
                    }
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
