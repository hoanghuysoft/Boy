import { BLURHASH } from "@/utils/getblurhash";


export const pickFallbackBlurhash = (seed: string = ""): string => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    return BLURHASH[Math.abs(hash) % BLURHASH.length];
};

/**
 * Returns the item's own blurhash if present, otherwise a deterministic
 * fallback chosen from a curated pool using the provided seed (media id / url).
 */
export const resolveBlurhash = (
    itemBlurhash: string | null | undefined,
    seed: string | null | undefined,
): string => itemBlurhash || pickFallbackBlurhash(seed ?? "");
