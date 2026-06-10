import type { ChatResponse } from "@/types/shows";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { showsClient } from "../client";
import { showsKeys } from "../queryKeys";

export const getChatMessages = async (i?: string, c?: string): Promise<ChatResponse> => {
    const res = await showsClient.get("/chat", {
        params: { i, c },
    });
    return res.data;
};

/**
 * Get chat messages (usually latest messages, or for a specific page).
 * staleTime: 5 seconds to prevent excessive polling while keeping it fresh.
 */
export const useChatQuery = (i?: string, c?: string) => {
    return useQuery({
        queryKey: showsKeys.chat(i, c),
        queryFn: () => getChatMessages(i, c),
        staleTime: 5 * 1000,
    });
};

/**
 * Infinite scroll chat query for fetching older messages (backward pagination).
 * Starts with latest messages, and retrieves older messages prior to the oldest message ID.
 */
export const useChatInfiniteQuery = () => {
    return useInfiniteQuery({
        queryKey: showsKeys.chat(),
        queryFn: ({ pageParam }) => {
            const { i, c } = pageParam as { i?: string; c?: string } || {};
            return getChatMessages(i, c);
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.messages || lastPage.messages.length === 0) {
                return undefined;
            }
            // Message IDs in chat archives are sequentially increasing,
            // so older messages have smaller IDs. The minimum ID is the oldest.
            const ids = lastPage.messages
                .map((m) => parseInt(m.id, 10))
                .filter((id) => !isNaN(id));
            if (ids.length === 0) return undefined;
            const minId = Math.min(...ids);
            return {
                i: minId.toString(),
                c: "3", // '3' is the page direction/offset for older messages in CBox archive
            };
        },
        initialPageParam: {} as { i?: string; c?: string },
        staleTime: 5 * 1000,
    });
};
