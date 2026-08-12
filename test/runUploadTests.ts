import { mock } from 'bun:test';

// Mocks
const mockUpload = mock();
const mockGetImageDimensions = mock();
const mockGenerateBlurhash = mock();

// Mock react-native-nitro-modules
mock.module('react-native-nitro-modules', () => ({
    NitroModules: {},
}));

// Mock react-native-blurhash native TurboModule
mock.module('react-native-blurhash', () => ({
    Blurhash: {
        encode: mock(),
    },
}));

// Mock react-native
mock.module('react-native', () => ({
    Image: { getSize: () => {} },
    Platform: { OS: 'ios' },
    TurboModuleRegistry: { getEnforcing: () => ({ install: () => {} }) },
    NativeModules: {
        RNCNetInfo: {
            getCurrentState: () => Promise.resolve({ isConnected: true }),
            addListener: () => {},
            removeListeners: () => {},
        },
    },
}));

mock.module('@react-native-community/netinfo', () => ({
    default: {
        fetch: () => Promise.resolve({ isConnected: true }),
        addEventListener: () => () => {},
    },
}));

mock.module('../services/client', () => ({
    client: { post: mock(), get: mock(), put: mock(), delete: mock() },
}));

mock.module('expo-file-system', () => ({
    File: function (uri: string) {
        return { uri, upload: mockUpload };
    },
    UploadType: { MULTIPART: 'MULTIPART', BINARY_CONTENT: 'BINARY_CONTENT' },
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

// Correct relative path from test/ to services/mediaUpload
mock.module('../services/mediaUpload', () => ({
    generateBlurhash: mockGenerateBlurhash,
    getImageDimensions: mockGetImageDimensions,
}));

// Dynamic import after mocks
const { uploadToThirdParty } = await import('../services/thirdPartyUpload');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ ${message}`);
        failed++;
    }
}

console.log('Running Third-Party Upload Edge Case Tests...\n');

// Test 1: Image Upload Success with pre-existing metadata
{
    mockUpload.mockReset();
    mockGetImageDimensions.mockReset();
    mockGenerateBlurhash.mockReset();

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

    const result = await uploadToThirdParty({
        uri: 'file:///path/to/photo.jpg',
        name: 'photo.jpg',
        type: 'image/jpeg',
        width: 1920,
        height: 1080,
        blurhash: 'LGF5?xYk^6#M',
    });

    assert(result.url === 'https://i.ibb.co/abc/photo.jpg', 'ImgBB returns correct photo URL');
    assert(result.thumbnailUrl === 'https://i.ibb.co/abc/thumb.jpg', 'ImgBB returns correct thumbnail URL');
    assert(result.width === 1920 && result.height === 1080, 'Preserves provided width and height');
    assert(result.blurhash === 'LGF5?xYk^6#M', 'Preserves provided blurhash');
    assert(mockGetImageDimensions.mock.calls.length === 0, 'Does not re-calculate dimensions if present');
    assert(mockGenerateBlurhash.mock.calls.length === 0, 'Does not re-generate blurhash if present');
}

// Test 2: Image Upload with missing blurhash and missing dimensions
{
    mockUpload.mockReset();
    mockGetImageDimensions.mockReset();
    mockGenerateBlurhash.mockReset();

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

    const result = await uploadToThirdParty({
        uri: 'file:///path/to/photo.jpg',
        type: 'image/png',
    });

    assert(result.url === 'https://i.ibb.co/abc/photo.jpg', 'ImgBB upload succeeds');
    assert(result.width === 1280 && result.height === 720, 'Calculates missing width and height via getImageDimensions');
    assert(result.blurhash === 'U%L_g_j[ayfQ~qfQj[fQ', 'Calculates missing blurhash via generateBlurhash');
    assert(mockGenerateBlurhash.mock.calls.length === 1, 'generateBlurhash was called once');
    assert(mockGetImageDimensions.mock.calls.length === 1, 'getImageDimensions was called once');
}

// Test 3: Video Upload (x02.me)
{
    mockUpload.mockReset();
    mockGetImageDimensions.mockReset();
    mockGenerateBlurhash.mockReset();

    mockUpload.mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({
            success: true,
            data: {
                url: 'https://up.x02.me/file/video.mp4',
            },
        }),
    });

    const result = await uploadToThirdParty({
        uri: 'file:///path/to/video.mp4',
        type: 'video/mp4',
        width: 1920,
        height: 1080,
    });

    assert(result.url === 'https://up.x02.me/file/video.mp4', 'x02.me returns correct video URL');
    assert(result.thumbnailUrl === null, 'Video thumbnail is null for x02');
    assert(result.blurhash === null, 'Blurhash is null for video');
    assert(result.width === 1920 && result.height === 1080, 'Video dimensions are preserved');
    assert(mockGenerateBlurhash.mock.calls.length === 0, 'Does not generate blurhash for video');
}

// Test 4: Graceful fallback when Blurhash encoding returns null / fails
{
    mockUpload.mockReset();
    mockGetImageDimensions.mockReset();
    mockGenerateBlurhash.mockReset();

    mockUpload.mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({
            success: true,
            data: { url: 'https://i.ibb.co/abc/photo.jpg', width: 800, height: 600 },
        }),
    });

    mockGenerateBlurhash.mockResolvedValueOnce(null);

    const result = await uploadToThirdParty({
        uri: 'file:///path/to/corrupt.jpg',
        type: 'image/jpeg',
    });

    assert(result.url === 'https://i.ibb.co/abc/photo.jpg', 'Upload completes');
    assert(result.blurhash === null, 'Blurhash gracefully falls back to null when encoding fails');
}

// Test 5: Graceful fallback when getImageDimensions returns null / fails
{
    mockUpload.mockReset();
    mockGetImageDimensions.mockReset();
    mockGenerateBlurhash.mockReset();

    mockUpload.mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({
            success: true,
            data: { url: 'https://i.ibb.co/abc/photo.jpg', width: null, height: null },
        }),
    });

    mockGenerateBlurhash.mockResolvedValueOnce('HASH123');
    mockGetImageDimensions.mockResolvedValueOnce(null);

    const result = await uploadToThirdParty({
        uri: 'file:///path/to/invalid_header.jpg',
        type: 'image/jpeg',
    });

    assert(result.width === null && result.height === null, 'Dimensions fall back gracefully to null');
    assert(result.blurhash === 'HASH123', 'Blurhash is still preserved even if dimension check fails');
}

// Test 6: Missing ImgBB API key error
{
    mockUpload.mockReset();
    mockImgbbApiKey = '';

    let threw = false;
    try {
        await uploadToThirdParty({ uri: 'file:///path/to/photo.jpg', type: 'image/jpeg' });
    } catch (e: any) {
        threw = true;
        assert(e.message.includes('ImgBB API Key is required'), 'Throws error when ImgBB API key is missing');
    }
    assert(threw, 'Execution threw as expected for missing key');
}

// Test 7: HTTP 500 error from ImgBB
{
    mockUpload.mockReset();
    mockImgbbApiKey = 'test-key';

    mockUpload.mockResolvedValueOnce({ status: 500, body: 'Internal Server Error' });

    let threw = false;
    try {
        await uploadToThirdParty({ uri: 'file:///path/to/photo.jpg', type: 'image/jpeg' });
    } catch (e: any) {
        threw = true;
        assert(e.message.includes('ImgBB upload failed with status 500'), 'Throws error on HTTP 500 status');
    }
    assert(threw, 'Execution threw as expected on HTTP 500');
}

console.log(`\nTest Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
