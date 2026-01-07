export type TextPart = {
    text: string;
    type: 'text' | 'hashtag' | 'mention' | 'url';
};

export const parseCaption = (text: string): TextPart[] => {
    const parts: TextPart[] = [];
    const regex = /(#\w+|@\w+|(?:https?:\/\/|www\.)[^\s]+)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push({
                text: text.substring(lastIndex, match.index),
                type: 'text',
            });
        }

        // Add the match itself
        const matchText = match[0];
        let type: TextPart['type'] = 'text';

        if (matchText.startsWith('#')) {
            type = 'hashtag';
        } else if (matchText.startsWith('@')) {
            type = 'mention';
        } else if (matchText.startsWith('http') || matchText.startsWith('www')) {
            type = 'url';
        }

        parts.push({
            text: matchText,
            type,
        });

        lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
        parts.push({
            text: text.substring(lastIndex),
            type: 'text',
        });
    }

    return parts.length > 0 ? parts : [{ text, type: 'text' }];
};
