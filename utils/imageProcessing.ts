import { getImageDate } from "./imageDateExtractor";
import { createGridData, GridDataResult } from "./imageGridData";
import { groupImagesByDate, mergeOrphanDays } from "./imageGrouping";

/**
 * Processes images: extracts dates, sorts, groups, and creates grid data
 */
export const processImages = async (
    images: any[],
    numColumns: number
): Promise<GridDataResult> => {
    // 1. Read metadata and extract dates
    const imagesWithDate = await Promise.all(
        images.map(img => getImageDate(img))
    );

    // 2. Sort by date (newest first)
    imagesWithDate.sort((a, b) => b.date.valueOf() - a.date.valueOf());

    // 3. Group by date label
    let groups = groupImagesByDate(imagesWithDate);

    // 4. Merge orphan days (single-item days)
    groups = mergeOrphanDays(groups);

    // 5. Create grid data structure
    return createGridData(groups, numColumns);
};

