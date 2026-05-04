import { 
    NoteResponse, 
    NotesResponse, 
    CreateNoteInput, 
    UpdateNoteInput, 
    DeleteNoteResponse 
} from '@/types/note';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new note
 */
export const createNote = async (data: CreateNoteInput): Promise<NoteResponse> => {
    const response = await client.post<NoteResponse>('/api/notes', data);
    return response.data;
};

/**
 * Fetch notes with pagination
 */
export const getNotes = async (limit: number = 20, cursor?: string): Promise<NotesResponse> => {
    const params: Record<string, any> = { limit };
    if (cursor) {
        params.cursor = cursor;
    }
    const response = await client.get<NotesResponse>('/api/notes', { params });
    return response.data;
};

/**
 * Get a specific note by ID
 */
export const getNote = async (id: number): Promise<NoteResponse> => {
    const response = await client.get<NoteResponse>(`/api/notes/${id}`);
    return response.data;
};

/**
 * Update a specific note
 */
export const updateNote = async (id: number, data: UpdateNoteInput): Promise<NoteResponse> => {
    const response = await client.put<NoteResponse>(`/api/notes/${id}`, data);
    return response.data;
};

/**
 * Delete a specific note
 */
export const deleteNote = async (id: number): Promise<DeleteNoteResponse> => {
    const response = await client.delete<DeleteNoteResponse>(`/api/notes/${id}`);
    return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch paginated notes
 */
export const useNotes = (limit: number = 20) => {
    return useInfiniteQuery({
        queryKey: ['notes'],
        queryFn: ({ pageParam }) => getNotes(limit, pageParam),
        getNextPageParam: (lastPage) => lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor : undefined,
        initialPageParam: undefined as string | undefined,
    });
};

/**
 * Hook to fetch a single note by ID
 */
export const useNote = (id: number) => {
    return useQuery({
        queryKey: ['note', id],
        queryFn: () => getNote(id),
    });
};

/**
 * Hook to create a note
 */
export const useCreateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateNoteInput) => createNote(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
};

/**
 * Hook to update a note
 */
export const useUpdateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateNoteInput }) => updateNote(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
        },
    });
};

/**
 * Hook to delete a note
 */
export const useDeleteNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteNote(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['note', id] });
        },
    });
};
