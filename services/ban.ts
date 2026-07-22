import { useQuery } from '@tanstack/react-query';
import { client } from './client';
import { supabase } from './login';
import { authKeys } from './queryKeys';

export interface BanStatusResponse {
    isBanned: boolean;
    banReason?: string | null;
    bannedAt?: string | null;
    bannedUntil?: string | null;
}

/**
 * Service function: Fetch ban status for the active session.
 * Primary: GET /api/auth/ban-status endpoint
 * Fallback: Direct Supabase profiles query if API server is offline or unreachable
 */
export const getBanStatus = async (): Promise<BanStatusResponse> => {
    try {
        const response = await client.get<BanStatusResponse>('/api/auth/ban-status');
        if (response.data) {
            return response.data;
        }
    } catch (apiError) {
        // Fallback: Direct database RPC call via Supabase client
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user?.id) {
                return { isBanned: false };
            }

            const { data, error } = await supabase.rpc('check_my_ban_status');
            const banInfo = data?.[0];

            if (!error && banInfo?.is_banned) {
                const now = new Date();
                const until = banInfo.banned_until ? new Date(banInfo.banned_until) : null;
                if (!until || until > now) {
                    return {
                        isBanned: true,
                        banReason: banInfo.ban_reason,
                        bannedAt: banInfo.banned_at,
                        bannedUntil: banInfo.banned_until,
                    };
                }
            }

            // Direct query as secondary fallback
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_banned, ban_reason, banned_at, banned_until')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (profile?.is_banned) {
                const now = new Date();
                const until = profile.banned_until ? new Date(profile.banned_until) : null;
                if (!until || until > now) {
                    return {
                        isBanned: true,
                        banReason: profile.ban_reason,
                        bannedAt: profile.banned_at,
                        bannedUntil: profile.banned_until,
                    };
                }
            }
        } catch (dbError) {
            console.warn('Fallback ban check failed:', dbError);
        }
    }

    return { isBanned: false };
};

/**
 * React Query hook for subscribing to ban status updates
 */
export const useBanStatusQuery = (enabled: boolean = true) => {
    return useQuery({
        queryKey: authKeys.banStatus(),
        queryFn: getBanStatus,
        enabled,
        staleTime: 30 * 1000,
        refetchInterval: (query) => {
            // Stop rapid polling once banned state is detected
            return query.state.data?.isBanned ? false : 60 * 1000;
        },
    });
};
