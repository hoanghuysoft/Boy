export const compactNumberFormatter = new Intl.NumberFormat('en', { notation: 'compact' });

/**
 * Formats numbers into compact representations (e.g., 1000 -> "1K", 1200 -> "1.2K", 1000000 -> "1M").
 * Falls back safely to "0" if the number is undefined, null, or NaN.
 */
export function formatCompactNumber(value?: number | null): string {
    if (value === undefined || value === null || isNaN(value)) {
        return '0';
    }
    return compactNumberFormatter.format(value);
}

export const formatNumber = formatCompactNumber;
