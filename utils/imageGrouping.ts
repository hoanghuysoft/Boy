import dayjs from "dayjs";

export interface ImageWithDate {
    src: any;
    date: dayjs.Dayjs;
    uri: string;
}

export interface ImageGroup {
    title: string;
    items: ImageWithDate[];
}

/**
 * Formats date label for display
 */
const formatDateLabel = (date: dayjs.Dayjs): string => {
    if (date.isToday()) return "Today";
    if (date.isYesterday()) return "Yesterday";
    
    // Current year optimization
    if (date.year() === dayjs().year()) {
        return date.format("MMM D");
    }
    
    return date.format("MMM D, YYYY");
};

/**
 * Groups images by date label
 */
export const groupImagesByDate = (imagesWithDate: ImageWithDate[]): ImageGroup[] => {
    const groups: ImageGroup[] = [];

    imagesWithDate.forEach((item) => {
        const label = formatDateLabel(item.date);
        const lastGroup = groups[groups.length - 1];
        
        if (lastGroup && lastGroup.title === label) {
            lastGroup.items.push(item);
        } else {
            groups.push({ title: label, items: [item] });
        }
    });

    return groups;
};

/**
 * Merges single-item days into adjacent groups
 */
export const mergeOrphanDays = (groups: ImageGroup[]): ImageGroup[] => {
    const mergedGroups = [...groups];
    
    for (let i = mergedGroups.length - 1; i >= 0; i--) {
        if (mergedGroups[i].items.length === 1) {
            if (i > 0) {
                // Merge current item into PREVIOUS group
                mergedGroups[i - 1].items.push(...mergedGroups[i].items);
                mergedGroups.splice(i, 1);
            } else if (mergedGroups.length > 1) {
                // It is the first group, merge into the NEXT group
                mergedGroups[1].items.unshift(...mergedGroups[0].items);
                mergedGroups.splice(0, 1);
            }
        }
    }
    
    return mergedGroups;
};

