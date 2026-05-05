import React, { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { NativeNitroImage, useImage } from 'react-native-nitro-image';
import { fitContainer } from 'react-native-zoom-toolkit';
import { getCachedImageDimension, setCachedImageDimension } from './imageDimensionCache';

type GalleryImageProps = {
    uri: string;
    index: number;
    blurhash?: string | null;
};

const GalleryImage: React.FC<GalleryImageProps> = ({ uri }) => {
    const { width, height } = useWindowDimensions();

    // Seed the resolution from MMKV cache so the layout is correct on first render.
    const cachedResolution = getCachedImageDimension(uri);
    const [resolution, setResolution] = useState<{ width: number; height: number }>(
        cachedResolution ?? { width: 1, height: 1 }
    );

    // useImage fully loads the image into memory and exposes .width / .height
    // directly on the returned Image object — no onSuccess event needed.
    const { image } = useImage({ url: uri });

    useEffect(() => {
        if (image && image.width > 0 && image.height > 0) {
            setCachedImageDimension(uri, image.width, image.height);
            setResolution({ width: image.width, height: image.height });
        }
    }, [image, uri]);

    const size = fitContainer(resolution.width / resolution.height, { width, height });

    return (
        <View style={[size, { justifyContent: 'center', alignItems: 'center' }]}>
            {/* NitroImage is a HybridView — it must be clipped by a View with
                overflow: 'hidden', not by borderRadius on the NitroImage itself. */}
            <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <NativeNitroImage
                    image={image}
                    recyclingKey={uri}
                    resizeMode="contain"
                    style={{ width: '100%', height: '100%' }}
                />
            </View>
        </View>
    );
};

export default React.memo(GalleryImage);
