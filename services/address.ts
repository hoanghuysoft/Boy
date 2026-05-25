/**
 * Address service
 * Endpoints:
 *   GET  /api/profiles/[id]/addresses                  - List profile addresses (paginated)
 *   POST /api/profiles/[id]/addresses                  - Add an address (label, street, city, state, postal_code, country, is_primary)
 *   PUT  /api/profiles/[id]/addresses/[addressId]      - Update an address (label, street, city, state, postal_code, country, is_primary)
 *   DELETE /api/profiles/[id]/addresses/[addressId]    - Remove an address
 */

import { ProfileAddress } from "@/types/profileaddress";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { client } from "./client";

// ============================================================================
// Types
// ============================================================================

export interface AddressResponse {
    data: ProfileAddress[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface AddAddressPayload {
    profileId: string;
    label: string;
    street: string;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    country: string;
    is_primary?: boolean;
}

export interface UpdateAddressPayload {
    profileId: string;
    addressId: string;
    label: string;
    street: string;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    country: string;
    is_primary?: boolean;
}

export interface DeleteAddressPayload {
    profileId: string;
    addressId: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch paginated addresses for a profile
 */
export const getAddresses = async ({
    profileId,
    pageParam,
}: {
    profileId: string;
    pageParam?: string;
}): Promise<AddressResponse> => {
    const params: Record<string, any> = { limit: 50 };
    if (pageParam) params.cursor = pageParam;

    const response = await client.get<AddressResponse>(
        `/api/profiles/${profileId}/addresses`,
        { params }
    );
    return response.data;
};

/**
 * Add a new address to a profile
 */
export const addAddress = async ({
    profileId,
    label,
    street,
    city,
    state,
    postal_code,
    country,
    is_primary,
}: AddAddressPayload): Promise<{ data: ProfileAddress }> => {
    const response = await client.post<{ data: ProfileAddress }>(
        `/api/profiles/${profileId}/addresses`,
        { label, street, city, state, postal_code, country, is_primary }
    );
    return response.data;
};

/**
 * Update an address on a profile
 */
export const updateAddress = async ({
    profileId,
    addressId,
    label,
    street,
    city,
    state,
    postal_code,
    country,
    is_primary,
}: UpdateAddressPayload): Promise<{ data: ProfileAddress }> => {
    const response = await client.put<{ data: ProfileAddress }>(
        `/api/profiles/${profileId}/addresses/${addressId}`,
        { label, street, city, state, postal_code, country, is_primary }
    );
    return response.data;
};

/**
 * Remove an address from a profile
 */
export const deleteAddress = async ({
    profileId,
    addressId,
}: DeleteAddressPayload): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(
        `/api/profiles/${profileId}/addresses/${addressId}`
    );
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching profile addresses (infinite scroll)
 */
export const useInfiniteAddresses = (profileId: string) => {
    return useInfiniteQuery({
        queryKey: ["addresses", profileId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            getAddresses({ profileId, pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: AddressResponse) =>
            lastPage.pagination.hasNextPage
                ? lastPage.pagination.nextCursor ?? undefined
                : undefined,
        enabled: !!profileId,
    });
};

/**
 * Hook to add an address to a profile's list
 */
export const useAddAddress = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Omit<AddAddressPayload, 'profileId'>) =>
            addAddress({ profileId, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses", profileId] });
        },
    });
};

/**
 * Hook to update an address on a profile's list
 */
export const useUpdateAddress = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ addressId, ...payload }: Omit<UpdateAddressPayload, 'profileId'>) =>
            updateAddress({ profileId, addressId, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses", profileId] });
        },
    });
};

/**
 * Hook to delete an address from a profile's list
 * Performs optimistic removal so the UI updates instantly
 */
export const useDeleteAddress = (profileId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (addressId: string) =>
            deleteAddress({ profileId, addressId }),
        onMutate: async (addressId: string) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: ["addresses", profileId] });

            // Snapshot current data for rollback
            const previous = queryClient.getQueryData(["addresses", profileId]);

            // Optimistically remove the address from all pages
            queryClient.setQueryData(["addresses", profileId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: AddressResponse) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== addressId),
                        pagination: {
                            ...page.pagination,
                            total: Math.max(0, page.pagination.total - 1),
                        },
                    })),
                };
            });

            return { previous };
        },
        onError: (_err, _addressId, context) => {
            // Roll back on error
            if (context?.previous) {
                queryClient.setQueryData(["addresses", profileId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses", profileId] });
        },
    });
};
