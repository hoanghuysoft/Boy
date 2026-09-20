import { describe, expect, it } from 'bun:test';
import {
    buildNoteMarkdown,
    extractFirstImage,
    getNoteMarkdownStyle,
    legacyToMarkdown,
    parseNoteTitleAndBody,
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

    it('generates complete theme-aware markdown styles for light and dark modes', () => {
        const mockColors = {
            onSurface: '#0F172A',
            onSurfaceVariant: '#888888',
            secondary: '#0e64f6',
            outline: '#79747e',
            outlineVariant: '#e0e0e2',
        };
        const lightStyle = getNoteMarkdownStyle(mockColors, 'light', false);
        expect(lightStyle.paragraph.color).toBe('#0F172A');
        expect(lightStyle.list.color).toBe('#0F172A');
        expect(lightStyle.table.color).toBe('#0F172A');
        expect(lightStyle.table.headerTextColor).toBe('#0F172A');
        expect(lightStyle.taskList.checkedColor).toBe('#0e64f6');

        const darkStyle = getNoteMarkdownStyle(mockColors, 'dark', true);
        expect(darkStyle.paragraph.fontSize).toBe(17);
        expect(darkStyle.list.fontSize).toBe(17);
        expect(darkStyle.taskList.checkedTextColor).toContain('229, 231, 235');
    });
});
