import { create } from 'zustand';

interface GalleryState {
    isVisible: boolean;
    images: { uri: string }[];
    initialIndex: number;
    openGallery: (images: string[], index?: number) => void;
    closeGallery: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
    isVisible: false,
    images: [],
    initialIndex: 0,
    openGallery: (images: string[], index: number = 0) => set({
        isVisible: true,
        images: images.map(uri => ({ uri })),
        initialIndex: index,
    }),
    closeGallery: () => set({
        isVisible: false,
    }),
}));
