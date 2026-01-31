import FastImage from "@d11/react-native-fast-image";
import { FasterImageView } from "@rraut/react-native-faster-image";
import React from "react";
import { GalleryImageComponentProps } from "react-native-gallery-preview";

const FastImageComponent = ({ source, onLoad, style }: GalleryImageComponentProps) => {
    const uri = source.uri ?? '';
    return (
        <FasterImageView
            source={{ uri }}
            style={style}
        />
    );
};

// Export a render function for GestureViewer
export const renderImage = (imageUrl: string) => {
    return (
        <FastImage
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={FastImage.resizeMode.contain}
        />
    );
};

export default FastImageComponent;
