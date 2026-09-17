/**
 * Note Markdown utilities for parsing, normalizing, and formatting rich markdown notes.
 * Provides backwards compatibility for legacy note tags: [<title>...], [<img ... />], [<link ... />].
 */

const LEGACY_TITLE_REGEX = /\[<title>(.*?)<\/title>]/gi;
const LEGACY_IMG_REGEX = /\[<img\s+(.*?)\s*\/>]/gi;
const LEGACY_LINK_REGEX = /\[<link\s+(.*?)\s*\/>]/gi;

/**
 * Converts legacy note formatting tags to standard Markdown.
 */
export function legacyToMarkdown(content: string): string {
    if (!content) return '';

    let md = content;

    // Convert [<title>Title</title>] -> # Title
    md = md.replace(LEGACY_TITLE_REGEX, (_, title) => {
        const trimmed = title.trim();
        return trimmed ? `# ${trimmed}\n\n` : '';
    });

    // Convert [<img url />] -> ![](url)
    md = md.replace(LEGACY_IMG_REGEX, (_, url) => {
        const trimmed = url.trim();
        return trimmed ? `![](${trimmed})\n\n` : '';
    });

    // Convert [<link url />] -> [url](url)
    md = md.replace(LEGACY_LINK_REGEX, (_, url) => {
        const trimmed = url.trim();
        return trimmed ? `[${trimmed}](${trimmed})\n\n` : '';
    });

    // Clean up excessive blank lines
    return md.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Parses title and body from note markdown content.
 */
export function parseNoteTitleAndBody(rawContent: string): { title: string; body: string } {
    if (!rawContent) return { title: '', body: '' };

    const md = legacyToMarkdown(rawContent);

    // Check if starts with H1 heading (# Title)
    const h1Match = md.match(/^#\s+([^\n]+)(?:\n+([\s\S]*))?$/);
    if (h1Match) {
        return {
            title: h1Match[1].trim(),
            body: (h1Match[2] || '').trim(),
        };
    }

    return {
        title: '',
        body: md.trim(),
    };
}

/**
 * Builds note markdown combining title and body.
 */
export function buildNoteMarkdown(title: string, body: string): string {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
        return trimmedBody;
    }

    // If body already starts with the exact H1 header, don't duplicate
    if (trimmedBody.startsWith(`# ${trimmedTitle}`)) {
        return trimmedBody;
    }

    if (!trimmedBody) {
        return `# ${trimmedTitle}`;
    }

    return `# ${trimmedTitle}\n\n${trimmedBody}`;
}

/**
 * Extracts the first image URL from note markdown (or legacy format).
 */
export function extractFirstImage(rawContent: string): string | null {
    if (!rawContent) return null;

    const md = legacyToMarkdown(rawContent);

    // Standard markdown image: ![alt](url)
    const mdImgMatch = md.match(/!\[.*?\]\((https?:\/\/[^\s\)\"\']+)\)/i);
    if (mdImgMatch) {
        return mdImgMatch[1];
    }

    // HTML img tag: <img src="url" />
    const htmlImgMatch = md.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (htmlImgMatch) {
        return htmlImgMatch[1];
    }

    return null;
}

/**
 * Extracts all image URLs in order from note content.
 */
export function extractAllImages(rawContent: string): string[] {
    if (!rawContent) return [];

    const md = legacyToMarkdown(rawContent);
    const images: string[] = [];

    const mdImgRegex = /!\[.*?\]\((https?:\/\/[^\s\)\"\']+)\)/gi;
    let match: RegExpExecArray | null;
    while ((match = mdImgRegex.exec(md)) !== null) {
        images.push(match[1]);
    }

    const htmlImgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
    while ((match = htmlImgRegex.exec(md)) !== null) {
        if (!images.includes(match[1])) {
            images.push(match[1]);
        }
    }

    return images;
}

/**
 * Extracts all link URLs in order from note content.
 */
export function extractAllLinks(rawContent: string): string[] {
    if (!rawContent) return [];

    const md = legacyToMarkdown(rawContent);
    const links: string[] = [];

    // [text](url) - ignore image tags which start with ![
    const linkRegex = /(?:^|[^!])\[(?:.*?)\]\((https?:\/\/[^\s\)\"\']+)\)/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(md)) !== null) {
        links.push(match[1]);
    }

    return links;
}

/**
 * Strips markdown and legacy syntax to create a clean text preview snippet.
 */
export function stripMarkdown(rawContent: string): string {
    if (!rawContent) return '';

    let text = legacyToMarkdown(rawContent);

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove images
    text = text.replace(/!\[.*?\]\(.*?\)/g, ' ');
    text = text.replace(/<img[^>]*>/gi, ' ');

    // Convert links [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove headers (#, ##, ###)
    text = text.replace(/^#{1,6}\s+/gm, '');

    // Remove blockquotes (> quote)
    text = text.replace(/^>\s+/gm, '');

    // Remove task list markers
    text = text.replace(/^[-*+]\s+\[[ xX]\]\s+/gm, '');

    // Remove unordered/ordered list markers
    text = text.replace(/^[-*+]\s+/gm, '');
    text = text.replace(/^\d+\.\s+/gm, '');

    // Remove horizontal rules
    text = text.replace(/^([-*_]){3,}\s*$/gm, ' ');

    // Remove formatting symbols: bold, italic, strikethrough, spoiler
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');
    text = text.replace(/~~(.*?)~~/g, '$1');
    text = text.replace(/\|\|(.*?)\|\|/g, '$1');

    // Remove table lines and pipes
    text = text.replace(/\|/g, ' ');
    text = text.replace(/^[-:\s|]+$/gm, ' ');

    // Collapse whitespace
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Toggles a task checkbox item at the given 0-based index in the markdown string.
 */
export function toggleTaskInMarkdown(markdown: string, targetIndex: number, newChecked: boolean): string {
    let currentIndex = 0;
    return markdown.replace(/(- \[[ xX]\])/g, (match) => {
        if (currentIndex === targetIndex) {
            currentIndex++;
            return newChecked ? '- [x]' : '- [ ]';
        }
        currentIndex++;
        return match;
    });
}
