import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import TurboImage from 'react-native-turbo-image';
import { fitContainer } from 'react-native-zoom-toolkit';

type GalleryImageProps = {
    uri: string;
    index: number;
};

const GalleryImage: React.FC<GalleryImageProps> = ({ uri, index }) => {
    const { width, height } = useWindowDimensions();
    const [resolution, setResolution] = useState<{ width: number; height: number }>({
        width: 1,
        height: 1,
    });

    const size = fitContainer(resolution.width / resolution.height, { width, height });

    return (
        <View style={[size, { justifyContent: 'center', alignItems: 'center' }]}>
            <TurboImage
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                cachePolicy="dataCache"
                onSuccess={(e: any) => {
                    const w = e?.nativeEvent?.width ?? e?.width ?? 0;
                    const h = e?.nativeEvent?.height ?? e?.height ?? 0;
                    if (w > 0 && h > 0) {
                        setResolution({ width: w, height: h });
                    }
                }}
                format={uri.endsWith('.gif') ? 'gif' : undefined}
            />
        </View>
    );
};

export default React.memo(GalleryImage);
