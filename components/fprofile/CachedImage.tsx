import { useCachedImage } from '@/hooks/useCachedImage';
import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';

/**
 * Drop-in Image replacement that reads from the local file cache first.
 * Only used in the localfb / FProfile feature.
 */
interface CachedImageProps extends Omit<ImageProps, 'source'> {
    uri: string | null | undefined;
    style?: StyleProp<ImageStyle>;
}

const CachedImage: React.FC<CachedImageProps> = ({ uri, style, ...rest }) => {
    const resolvedUri = useCachedImage(uri);

    if (!resolvedUri) return null;

    return (
        <Image
            source={{ uri: resolvedUri }}
            style={style}
            {...rest}
        />
    );
};

export default React.memo(CachedImage);
