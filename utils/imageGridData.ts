import { ImageWithDate } from "./imageGrouping";

export type GridItemType =
    | { type: 'header'; title: string }
    | { type: 'row'; items: any[]; startIndex: number };

export interface GridDataResult {
    gridData: GridItemType[];
    sortedUrls: string[];
}

/**
 * Creates grid data structure from grouped images
 */
export const createGridData = (
    groups: { title: string; items: ImageWithDate[] }[],
    numColumns: number
): GridDataResult => {
    const gridData: GridItemType[] = [];
    const sortedUrls: string[] = [];
    let globalIndex = 0;

    groups.forEach((group) => {
        // Push header
        gridData.push({ type: 'header', title: group.title });

        // Chunk items into rows
        for (let i = 0; i < group.items.length; i += numColumns) {
            const chunk = group.items.slice(i, i + numColumns);

            gridData.push({
                type: 'row',
                items: chunk.map(c => c.src),
                startIndex: globalIndex
            });

            // Add to flat list for Galeria swipe context
            chunk.forEach(c => sortedUrls.push(c.uri));
            globalIndex += chunk.length;
        }
    });

    return { gridData, sortedUrls };
};

