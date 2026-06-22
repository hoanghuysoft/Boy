/**
 * Facebook Music Service
 *
 * Uses StoriesCreateMusicSelectorMainPageQuery (doc_id=23943555345255534, product="FB_COMPOSER")
 * to fetch the music picker sections and search results.
 *
 * Auth is provided by the user's saved FB session (cookies + fb_dtsg) stored in MMKV.
 * Key prefix: fb_auth:*
 */

import { storage } from "./storage";

// ─── MMKV keys ───────────────────────────────────────────────────────────────
const FB_AUTH_KEYS = {
    cUser: "fb_auth:c_user",
    xs: "fb_auth:xs",
    fr: "fb_auth:fr",
    sb: "fb_auth:sb",
    datr: "fb_auth:datr",
    fbDtsg: "fb_auth:fb_dtsg",
} as const;

const SECTIONS_CACHE_KEY = "fb_music:sections_cache";
const SECTIONS_CACHE_TIME_KEY = "fb_music:sections_cache_time";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FBMusicTrack {
    id: string;
    title: string;
    artist: string;
    albumTitle: string;
    coverUrl: string;
    audioUrl: string;
    durationMs: number;
    isSaved: boolean;
    /** Suggested start times (ms) for highlights/reels */
    highlightTimesMs: number[];
}

export interface FBMusicSection {
    type: "section" | "header" | "track";
    title: string;
    /** Only present when type === "section" */
    tracks?: FBMusicTrack[];
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function saveFBAuth(params: {
    cUser: string;
    xs: string;
    fr?: string;
    sb?: string;
    datr?: string;
    fbDtsg: string;
}) {
    storage.set(FB_AUTH_KEYS.cUser, params.cUser);
    storage.set(FB_AUTH_KEYS.xs, params.xs);
    storage.set(FB_AUTH_KEYS.fbDtsg, params.fbDtsg);
    if (params.fr) storage.set(FB_AUTH_KEYS.fr, params.fr);
    if (params.sb) storage.set(FB_AUTH_KEYS.sb, params.sb);
    if (params.datr) storage.set(FB_AUTH_KEYS.datr, params.datr);
}

export function clearFBAuth() {
    Object.values(FB_AUTH_KEYS).forEach((key) => storage.remove(key));
    storage.remove(SECTIONS_CACHE_KEY);
    storage.remove(SECTIONS_CACHE_TIME_KEY);
}

export function getFBAuth() {
    return {
        cUser: storage.getString(FB_AUTH_KEYS.cUser) ?? "",
        xs: storage.getString(FB_AUTH_KEYS.xs) ?? "",
        fr: storage.getString(FB_AUTH_KEYS.fr) ?? "",
        sb: storage.getString(FB_AUTH_KEYS.sb) ?? "",
        datr: storage.getString(FB_AUTH_KEYS.datr) ?? "",
        fbDtsg: storage.getString(FB_AUTH_KEYS.fbDtsg) ?? "",
    };
}

export function hasFBAuth(): boolean {
    const { cUser, fbDtsg } = getFBAuth();
    return !!(cUser && fbDtsg);
}

// ─── API call ─────────────────────────────────────────────────────────────────


export type FBMusicBridgeRequest = (variables: any) => Promise<any>;
let fbMusicBridgeFn: FBMusicBridgeRequest | null = null;
let currentBridgeOwner: string | null = null;

export function registerFBMusicBridge(fn: FBMusicBridgeRequest | null, ownerId: string) {
    if (fn) {
        fbMusicBridgeFn = fn;
        currentBridgeOwner = ownerId;
    } else if (currentBridgeOwner === ownerId) {
        fbMusicBridgeFn = null;
        currentBridgeOwner = null;
    }
}

async function callFBMusicGraphQL(searchText: string): Promise<any> {
    const auth = getFBAuth();
    if (!hasFBAuth()) throw new Error("Not authenticated with Facebook");

    const variables = {
        params: { first: 20, ...(searchText ? { search_text: searchText } : {}) },
        product: "FB_COMPOSER",
    };

    if (fbMusicBridgeFn) {
        return fbMusicBridgeFn(variables);
    }

    // Fallback to native fetch if bridge is not registered
    const variablesStr = JSON.stringify(variables);
    const body = new URLSearchParams({
        av: auth.cUser,
        __user: auth.cUser,
        __a: "1",
        fb_dtsg: auth.fbDtsg,
        lsd: "AVp", // minimal static LSD — FB accepts this for non-SPA callers
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "StoriesCreateMusicSelectorMainPageQuery",
        server_timestamps: "true",
        variables: variablesStr,
        doc_id: "23943555345255534",
    });

    const response = await fetch("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent":
                "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Origin": "https://www.facebook.com",
            "Referer": "https://www.facebook.com/stories/create",
            "x-fb-friendly-name": "StoriesCreateMusicSelectorMainPageQuery",
        },
        body: body.toString(),
    });

    if (!response.ok) {
        throw new Error(`FB API error: ${response.status}`);
    }

    const text = await response.text();
    // Facebook prefixes JSON with for (;;); to prevent JSON hijacking
    const cleanText = text.replace(/^for\s*\(\;;\)\;/, "");
    
    let json: any;
    try {
        json = JSON.parse(cleanText);
    } catch (e: any) {
        console.error("FB RAW RESP:", text.slice(0, 500));
        throw new Error("Failed to parse FB response: " + e.message);
    }

    // Fallback log silenced to keep output clean

    if (json.errors?.length) {
        throw new Error(json.errors[0].message ?? "Unknown FB API error");
    }
    if (json.error && json.errorSummary) {
        throw new Error(`FB API error: ${json.errorSummary} - ${json.errorDescription || ''}`);
    }

    return json;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseHighlights(tags: any[]): number[] {
    if (!Array.isArray(tags)) return [];
    return tags
        .filter((t) => t.type === "HIGHLIGHT_TIME_IN_MS")
        .map((t) => Number(t.name))
        .filter((n) => !isNaN(n));
}

function parseTrack(node: any): FBMusicTrack | null {
    try {
        const url = node.progressive_download?.[0]?.url;
        const title = node.title?.text ?? node.display_title?.text;
        const artist =
            node.display_artist?.text ?? node.display_subtitle?.text;
        const coverUrl =
            node.cover_artwork?.uri ??
            node.display_image?.uri;
        const id = node.id;
        const durationMs = node.duration_in_ms ?? 0;
        const isSaved = node.is_saved_by_viewer ?? false;
        const albumTitle = node.album_title ?? "";
        const highlightTimesMs = parseHighlights(node.tags ?? []);

        if (!id || !url || !title || !artist || !coverUrl) return null;

        return { id, title, artist, albumTitle, coverUrl, audioUrl: url, durationMs, isSaved, highlightTimesMs };
    } catch {
        return null;
    }
}

function parseResponse(json: any): FBMusicSection[] {
    const edges: any[] =
        json?.data?.xfb_music_picker_connection_container?.items?.edges ?? [];

    const result: FBMusicSection[] = [];

    for (const edge of edges) {
        const node = edge?.node;
        if (!node) continue;

        const item = node.item;
        const typename = item?.__typename;

        if (typename === "MusicPickerMediaTagWithAudioAssetsWrapper") {
            // Grouped section (e.g. "For you", "New releases")
            const subTracks = (node.sub_items ?? [])
                .map(parseTrack)
                .filter(Boolean) as FBMusicTrack[];
            result.push({
                type: "section",
                title: item.display_title?.text ?? "",
                tracks: subTracks,
            });
        } else if (typename === "MusicPickerHeaderItem") {
            // Separator header (e.g. "Popular")
            result.push({ type: "header", title: item.display_title?.text ?? "" });
        } else if (typename === "AudioAsset") {
            // Flat track directly in list
            const track = parseTrack(item);
            if (track) {
                result.push({ type: "track", title: track.title, tracks: [track] });
            }
        }
    }

    return result;
}

// ─── Public API ──────────────────────────────────────────────────────────────
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

function getCachedFBMusic(): FBMusicSection[] | null {
    try {
        const cached = storage.getString(SECTIONS_CACHE_KEY);
        const time = storage.getNumber(SECTIONS_CACHE_TIME_KEY) ?? 0;
        if (cached && Date.now() - time < CACHE_EXPIRATION_MS) {
            return JSON.parse(cached);
        }
    } catch { /* ignore */ }
    return null;
}

function saveFBMusicCache(sections: FBMusicSection[]) {
    try {
        storage.set(SECTIONS_CACHE_KEY, JSON.stringify(sections));
        storage.set(SECTIONS_CACHE_TIME_KEY, Date.now());
    } catch { /* ignore */ }
}

/** Fetch music sections (For you, New releases, Popular...) with local cache & offline fallback */
export async function fetchFBMusic(): Promise<FBMusicSection[]> {
    try {
        // Try fresh cache first
        const cached = getCachedFBMusic();
        if (cached) return cached;

        const json = await callFBMusicGraphQL("");
        const parsed = parseResponse(json);
        if (parsed && parsed.length > 0) {
            saveFBMusicCache(parsed);
        }
        return parsed;
    } catch (e) {
        // Fallback to expired cache if request fails
        try {
            const cached = storage.getString(SECTIONS_CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch {}
        throw e;
    }
}

const searchCache = new Map<string, FBMusicTrack[]>();

/** Search music by text with in-memory caching */
export async function searchFBMusic(query: string): Promise<FBMusicTrack[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cacheKey = trimmed.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    const json = await callFBMusicGraphQL(trimmed);
    const sections = parseResponse(json);
    const tracks = sections.flatMap((s) => s.tracks ?? []);

    // Cache result, limit size to 50 entries
    if (searchCache.size > 50) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(cacheKey, tracks);

    return tracks;
}
