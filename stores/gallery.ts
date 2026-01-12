import { create } from 'zustand';

interface GalleryImage {
    uri: string;
    caption?: string;
    profileName?: string;
    isVerified?: boolean;
    musicUrl?: string;
    musicTitle?: string;
}

interface GalleryState {
    isVisible: boolean;
    images: GalleryImage[];
    initialIndex: number;
    openGallery: (images: GalleryImage[], index?: number) => void;
    closeGallery: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
    isVisible: false,
    images: [],
    initialIndex: 0,
    openGallery: (images: GalleryImage[], index: number = 0) => set({
        isVisible: true,
        images,
        initialIndex: index,
    }),
    closeGallery: () => set({
        isVisible: false,
    }),
}));
