import { describe, expect, it } from 'bun:test';
import {
    legacyToMarkdown,
    parseNoteTitleAndBody,
    buildNoteMarkdown,
    extractFirstImage,
    stripMarkdown,
    toggleTaskInMarkdown,
} from '../utils/noteMarkdown';

describe('noteMarkdown utils', () => {
    it('converts legacy note format to clean markdown', () => {
        const legacy = '[<title>My Vacation</title>]\n[<img https://example.com/pic.jpg />]\n[<link https://google.com />]\nEnjoyed the trip!';
        const md = legacyToMarkdown(legacy);
        expect(md).toContain('# My Vacation');
        expect(md).toContain('![](https://example.com/pic.jpg)');
        expect(md).toContain('[https://google.com](https://google.com)');
        expect(md).toContain('Enjoyed the trip!');
    });

    it('parses title and body correctly', () => {
        const content = '# Hello World\n\nThis is the content.';
        const { title, body } = parseNoteTitleAndBody(content);
        expect(title).toBe('Hello World');
        expect(body).toBe('This is the content.');
    });

    it('builds markdown cleanly', () => {
        const md = buildNoteMarkdown('Groceries', '- Milk\n- Bread');
        expect(md).toBe('# Groceries\n\n- Milk\n- Bread');
    });

    it('extracts first image', () => {
        const content = '# Title\n\nSome text with ![dog](https://images.com/dog.png) and ![cat](https://images.com/cat.png)';
        expect(extractFirstImage(content)).toBe('https://images.com/dog.png');
    });

    it('strips markdown for plain text summary', () => {
        const md = '# Header\n\n**Bold** and *italic* text with [link](https://test.com) and `code`.\n- Item 1\n- Item 2';
        const stripped = stripMarkdown(md);
        expect(stripped).toBe('Header Bold and italic text with link and code. Item 1 Item 2');
    });

    it('toggles task items in markdown', () => {
        const md = '- [ ] Task 1\n- [ ] Task 2\n- [x] Task 3';
        const toggled = toggleTaskInMarkdown(md, 1, true);
        expect(toggled).toBe('- [ ] Task 1\n- [x] Task 2\n- [x] Task 3');
    });
});
