import { describe, expect, mock, test, beforeEach } from 'bun:test';

// ============================================================================
// Mocks for Third-Party & React Native modules
// ============================================================================

const mockUpload = mock();
const mockGetImageDimensions = mock();
const mockGenerateBlurhash = mock();

mock.module('react-native', () => ({
    Image: { getSize: mock() },
    Platform: { OS: 'ios', select: (obj: any) => obj.ios },
}));

mock.module('react-native-mmkv', () => ({
    MMKV: class MockMMKV {
        getString() { return null; }
        set() {}
        remove() {}
    },
}));

mock.module('../services/storage', () => ({
    settingsStorage: {
        getString: () => null,
        set: () => {},
        remove: () => true,
    },
}));

mock.module('expo-file-system', () => ({
    File: function (uri: string) {
        return {
            uri,
            upload: mockUpload,
        };
    },
    UploadType: {
        MULTIPART: 'MULTIPART',
        BINARY_CONTENT: 'BINARY_CONTENT',
    },
}));

let mockImgbbApiKey = 'test-imgbb-key';
let mockX02ApiKey = 'test-x02-key';

mock.module('@/stores/settings', () => ({
    useSettingsStore: {
        getState: () => ({
            imgbbApiKey: mockImgbbApiKey,
            x02ApiKey: mockX02ApiKey,
        }),
    },
}));

mock.module('./mediaUpload', () => ({
    generateBlurhash: mockGenerateBlurhash,
    getImageDimensions: mockGetImageDimensions,
}));

import { uploadToThirdParty } from '../services/thirdPartyUpload';
import { FileAsset } from '../services/mediaUpload';

describe('Third Party Upload Client Service & Edge Cases', () => {
    beforeEach(() => {
        mockUpload.mockReset();
        mockGetImageDimensions.mockReset();
        mockGenerateBlurhash.mockReset();
        mockImgbbApiKey = 'test-imgbb-key';
        mockX02ApiKey = 'test-x02-key';
    });

    test('1. Image Upload Success (ImgBB) with full pre-existing metadata', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    url: 'https://i.ibb.co/abc/photo.jpg',
                    thumb: { url: 'https://i.ibb.co/abc/thumb.jpg' },
                    width: 1920,
                    height: 1080,
                },
            }),
        });

        const file: FileAsset = {
            uri: 'file:///path/to/photo.jpg',
            name: 'photo.jpg',
            type: 'image/jpeg',
            width: 1920,
            height: 1080,
            blurhash: 'LGF5?xYk^6#M',
        };

        const result = await uploadToThirdParty(file);

        expect(result).toEqual({
            url: 'https://i.ibb.co/abc/photo.jpg',
            thumbnailUrl: 'https://i.ibb.co/abc/thumb.jpg',
            width: 1920,
            height: 1080,
            blurhash: 'LGF5?xYk^6#M',
        });
        expect(mockGetImageDimensions).not.toHaveBeenCalled();
        expect(mockGenerateBlurhash).not.toHaveBeenCalled();
    });

    test('2. Image Upload (ImgBB) calculates missing blurhash and missing dimensions', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    url: 'https://i.ibb.co/abc/photo.jpg',
                    thumb: null,
                    width: null,
                    height: null,
                },
            }),
        });

        mockGenerateBlurhash.mockResolvedValueOnce('U%L_g_j[ayfQ~qfQj[fQ');
        mockGetImageDimensions.mockResolvedValueOnce({ width: 1280, height: 720 });

        const file: FileAsset = {
            uri: 'file:///path/to/photo.jpg',
            type: 'image/png',
        };

        const result = await uploadToThirdParty(file);

        expect(result.url).toBe('https://i.ibb.co/abc/photo.jpg');
        expect(result.width).toBe(1280);
        expect(result.height).toBe(720);
        expect(result.blurhash).toBe('U%L_g_j[ayfQ~qfQj[fQ');
        expect(mockGenerateBlurhash).toHaveBeenCalledWith('file:///path/to/photo.jpg');
        expect(mockGetImageDimensions).toHaveBeenCalledWith('file:///path/to/photo.jpg');
    });

    test('3. Video Upload Success (x02.me)', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    url: 'https://up.x02.me/file/video.mp4',
                },
            }),
        });

        const file: FileAsset = {
            uri: 'file:///path/to/video.mp4',
            type: 'video/mp4',
            width: 1920,
            height: 1080,
        };

        const result = await uploadToThirdParty(file);

        expect(result).toEqual({
            url: 'https://up.x02.me/file/video.mp4',
            thumbnailUrl: null,
            width: 1920,
            height: 1080,
            blurhash: null,
        });
        expect(mockGenerateBlurhash).not.toHaveBeenCalled();
    });

    test('4. Graceful fallback when Blurhash encoding fails', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    url: 'https://i.ibb.co/abc/photo.jpg',
                    width: 800,
                    height: 600,
                },
            }),
        });

        mockGenerateBlurhash.mockResolvedValueOnce(null);

        const file: FileAsset = {
            uri: 'file:///path/to/corrupt.jpg',
            type: 'image/jpeg',
        };

        const result = await uploadToThirdParty(file);

        expect(result.url).toBe('https://i.ibb.co/abc/photo.jpg');
        expect(result.blurhash).toBeNull();
    });

    test('5. Graceful fallback when getImageDimensions fails', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    url: 'https://i.ibb.co/abc/photo.jpg',
                    width: null,
                    height: null,
                },
            }),
        });

        mockGenerateBlurhash.mockResolvedValueOnce('HASH123');
        mockGetImageDimensions.mockResolvedValueOnce(null);

        const file: FileAsset = {
            uri: 'file:///path/to/invalid_header.jpg',
            type: 'image/jpeg',
        };

        const result = await uploadToThirdParty(file);

        expect(result.url).toBe('https://i.ibb.co/abc/photo.jpg');
        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
        expect(result.blurhash).toBe('HASH123');
    });

    test('6. Missing ImgBB API Key throws clear error', async () => {
        mockImgbbApiKey = '';

        const file: FileAsset = {
            uri: 'file:///path/to/photo.jpg',
            type: 'image/jpeg',
        };

        expect(uploadToThirdParty(file)).rejects.toThrow(
            'ImgBB API Key is required for image uploads. Please enter it in Settings.'
        );
    });

    test('7. ImgBB Upload Server Error (500 Status)', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 500,
            body: 'Internal Server Error',
        });

        const file: FileAsset = {
            uri: 'file:///path/to/photo.jpg',
            type: 'image/jpeg',
        };

        expect(uploadToThirdParty(file)).rejects.toThrow(
            'ImgBB upload failed with status 500: Internal Server Error'
        );
    });

    test('8. ImgBB Upload Unsuccessful response (success: false)', async () => {
        mockUpload.mockResolvedValueOnce({
            status: 200,
            body: JSON.stringify({
                success: false,
                error: { message: 'Invalid API Key' },
            }),
        });

        const file: FileAsset = {
            uri: 'file:///path/to/photo.jpg',
            type: 'image/jpeg',
        };

        expect(uploadToThirdParty(file)).rejects.toThrow('Invalid API Key');
    });
});
