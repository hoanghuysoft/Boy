import { useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * Shared hook for handling taps on mentions (@username) and hashtags (#tag).
 */
export function useContentNavigation() {
    const router = useRouter();

    const handleMentionPress = useCallback((mention: string) => {
        const username = mention.startsWith('@') ? mention.slice(1) : mention;
        router.push({
            pathname: '/profile/[id]',
            params: { id: username },
        });
    }, [router]);

    const handleHashtagPress = useCallback((hashtag: string) => {
        const tag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
        router.push(`/hashtag/${encodeURIComponent(tag)}`);
    }, [router]);

    return {
        handleMentionPress,
        handleHashtagPress,
    };
}
