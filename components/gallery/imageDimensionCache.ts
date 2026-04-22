import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "gallery-image-dimensions" });
const DIMENSION_CACHE_PREFIX = "dimension:v1:";

export const getCachedImageDimension = (uri?: string | null) => {
    if (!uri) return null;

    const raw = storage.getString(`${DIMENSION_CACHE_PREFIX}${uri}`);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        const width = Number(parsed?.width);
        const height = Number(parsed?.height);

        if (width > 0 && height > 0) {
            return { width, height };
        }
    } catch {
        return null;
    }

    return null;
};

export const setCachedImageDimension = (
    uri: string | null | undefined,
    width?: number,
    height?: number
) => {
    if (!uri || !width || !height || width <= 0 || height <= 0) return;

    storage.set(
        `${DIMENSION_CACHE_PREFIX}${uri}`,
        JSON.stringify({ width, height })
    );
};
