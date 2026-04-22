// Curated set of soft/pleasant blurhashes used as fallback placeholders while
// thumbnails (photos & video thumbnails) are loading. We pick deterministically
// based on a seed (typically the media id) so cards never flicker to a
// different placeholder on re-render / recycle.
const FALLBACK_BLURHASHES = [
    "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    "LKN]Rv%2Tw=w]~RBVZRi};RPxuwH",
    "L9AB*A~qV@9F-;of%MRj00Rjt7WB",
    "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    "L4Ry.W_2.m.m%N?aM{R*pHNHs8r?",
    "LGF5?xYk^6#M@-5c,1J5@[or[Q6.",
    "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
    "LCGu`I_M00?c~qNGadM{00M{xufP",
    "LDFGaaxa02ay9{Ix0A0000E2~q_3",
    "L8A0:0xs00WB00az%MR*00IU~qof",
];

export const pickFallbackBlurhash = (seed: string = ""): string => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    return FALLBACK_BLURHASHES[Math.abs(hash) % FALLBACK_BLURHASHES.length];
};

/**
 * Returns the item's own blurhash if present, otherwise a deterministic
 * fallback chosen from a curated pool using the provided seed (media id / url).
 */
export const resolveBlurhash = (
    itemBlurhash: string | null | undefined,
    seed: string | null | undefined,
): string => itemBlurhash || pickFallbackBlurhash(seed ?? "");
