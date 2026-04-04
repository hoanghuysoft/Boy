import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import TurboImage from 'react-native-turbo-image';
import { fitContainer } from 'react-native-zoom-toolkit';

type GalleryImageProps = {
    uri: string;
    index: number;
    blurhash?: string | null;
};

const GalleryImage: React.FC<GalleryImageProps> = ({ uri, index, blurhash }) => {
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
                placeholder={
                    typeof blurhash === 'string' && blurhash.trim().length > 0
                        ? { blurhash: blurhash.trim() }
                        : undefined
                }
                onSuccess={(e: any) => {
                    const w = e?.nativeEvent?.width ?? e?.width ?? 0;
                    const h = e?.nativeEvent?.height ?? e?.height ?? 0;
                    if (w > 0 && h > 0) {
                        setResolution({ width: w, height: h });
                    }
                }}
                format={uri.endsWith('.gif') ? 'gif' : undefined}
            />
            {/* <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={150}
                onLoad={(e: any) => {
                    const w = e?.source?.width ?? e?.nativeEvent?.width ?? e?.width ?? 0;
                    const h = e?.source?.height ?? e?.nativeEvent?.height ?? e?.height ?? 0;
                    if (w > 0 && h > 0) {
                        setResolution({ width: w, height: h });
                    }
                }}
            /> */}
        </View>
    );
};

export default React.memo(GalleryImage);
