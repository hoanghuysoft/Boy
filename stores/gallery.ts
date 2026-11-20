import { create } from 'zustand';

export interface GallerySourceRect {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
}

export interface GalleryImage {
    uri: string;
    caption?: string;
    profileName?: string;
    isVerified?: boolean;
    musicUrl?: string;
    musicTitle?: string;
    blurhash?: string | null;
    sourceKey?: string;
}

export interface OpenGalleryOptions {
    sourceRect?: GallerySourceRect | null;
    sourcePostId?: string | null;
    onIndexSync?: ((index: number) => void) | null;
}

interface GalleryState {
    isVisible: boolean;
    images: GalleryImage[];
    imagesUrl: string[];
    initialIndex: number;
    sourceRect: GallerySourceRect | null;
    sourcePostId: string | null;
    hiddenSourceKey: string | null;
    hiddenSourcePostId: string | null;
    onIndexSync: ((index: number) => void) | null;
    openGallery: (images: GalleryImage[], index?: number, options?: OpenGalleryOptions) => void;
    setHiddenSource: (sourceKey: string | null, postId?: string | null) => void;
    closeGallery: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
    isVisible: false,
    images: [],
    imagesUrl: [],
    initialIndex: 0,
    sourceRect: null,
    sourcePostId: null,
    hiddenSourceKey: null,
    hiddenSourcePostId: null,
    onIndexSync: null,
    openGallery: (images: GalleryImage[], index: number = 0, options?: OpenGalleryOptions) => set({
        isVisible: true,
        images,
        imagesUrl: images.map(image => image.uri),
        initialIndex: index,
        sourceRect: options?.sourceRect ?? null,
        sourcePostId: options?.sourcePostId ?? null,
        hiddenSourceKey: null,
        hiddenSourcePostId: null,
        onIndexSync: options?.onIndexSync ?? null,
    }),
    setHiddenSource: (sourceKey: string | null, postId: string | null = null) => set({
        hiddenSourceKey: sourceKey,
        hiddenSourcePostId: postId,
    }),
    closeGallery: () => set({
        isVisible: false,
        sourceRect: null,
        sourcePostId: null,
        hiddenSourceKey: null,
        hiddenSourcePostId: null,
        onIndexSync: null,
    }),
}));
