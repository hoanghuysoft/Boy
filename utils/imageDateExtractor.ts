import { readAsync } from "@lodev09/react-native-exify";
import dayjs from "dayjs";
import { Image } from "react-native";

/**
 * Extracts date from filename patterns like:
 * - IMG_YYYYMMDD_HHMMSS_xxx.jpg
 * - YYYYMMDD or YYYY-MM-DD
 */
export const extractDateFromFilename = (uri: string): dayjs.Dayjs | null => {
    try {
        const filename = uri.split('/').pop()?.split('?')[0] || '';
        
        // Pattern: IMG_YYYYMMDD_HHMMSS_xxx.jpg or similar
        const dateMatch = filename.match(/(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/);
        if (dateMatch) {
            const [, year, month, day, hour, minute, second] = dateMatch;
            return dayjs(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
        }
        
        // Pattern: YYYYMMDD or YYYY-MM-DD
        const simpleDateMatch = filename.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
        if (simpleDateMatch) {
            const [, year, month, day] = simpleDateMatch;
            return dayjs(`${year}-${month}-${day}`);
        }
    } catch (e) {
        // Ignore parsing errors
    }
    return null;
};

/**
 * Checks if URI is a Metro bundler URL (Exif reading won't work)
 */
const isMetroBundlerUrl = (uri: string): boolean => {
    return uri.includes('://192.168.') || 
           uri.includes('localhost') || 
           uri.includes('assets/');
};

/**
 * Gets image date from filename or Exif metadata
 */
export const getImageDate = async (img: any): Promise<{ src: any; date: dayjs.Dayjs; uri: string }> => {
    const resolvedSource = typeof img === 'string' ? { uri: img } : Image.resolveAssetSource(img);
    const uri = resolvedSource.uri || '';
    
    let date = dayjs('2000-01-01'); // Default fallback
    
    // 1. Try extracting date from filename first (works for local images)
    const filenameDate = extractDateFromFilename(uri);
    if (filenameDate && filenameDate.isValid()) {
        date = filenameDate;
    } else {
        // 2. Try reading Exif metadata (works for remote images or images with Exif)
        try {
            if (!isMetroBundlerUrl(uri)) {
                const metadata = await readAsync(uri);
                if (metadata?.DateTimeOriginal || metadata?.DateTime) {
                    const dateStr = (metadata?.DateTimeOriginal || metadata?.DateTime)?.replace(
                        /^(\d{4}):(\d{2}):(\d{2})/,
                        '$1-$2-$3'
                    );
                    const exifDate = dayjs(dateStr);
                    if (exifDate.isValid()) {
                        date = exifDate;
                    }
                }
            }
        } catch (e) {
            // Exif reading failed, use filename date or fallback
        }
    }
    
    return { src: img, date, uri };
};

