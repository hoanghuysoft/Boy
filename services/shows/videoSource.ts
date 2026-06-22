export interface VideoSourceConfig {
  uri: string;
  headers?: Record<string, string>;
}

/**
 * Resolves raw video URLs into standard string URLs or Source objects with custom headers.
 * For IP-locked referer-protected hosts like asiangayporn.tv:
 * Feeds the embed or video page URL to fetch client-side, obtaining a valid IP-bound token,
 * then returns the direct MP4 stream configured with correct Referer/User-Agent headers.
 */
export const resolveVideoSource = async (uri: string): Promise<string | VideoSourceConfig> => {
  if (!uri) return uri;

  if (uri.includes("asiangayporn.tv/embed/") || uri.includes("asiangayporn.tv/video/")) {
    try {
      const response = await fetch(uri, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://www.asiangayporn.tv/",
        },
      });
      const html = await response.text();
      const match = html.match(/video_url:\s*'([^']+)'/);
      if (match && match[1]) {
        return {
          uri: match[1],
          headers: {
            Referer: "https://www.asiangayporn.tv/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        };
      }
    } catch (e) {
      console.error("[resolveVideoSource] Client-side stream resolution failed:", e);
    }
  }

  // Fallback / standard passthrough
  return uri;
};
