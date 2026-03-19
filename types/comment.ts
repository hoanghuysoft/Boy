export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    profile_name: string;
    profile_avatar: string | null;
    profile_is_verified: boolean;
    profile_id: string | null;
}

export interface CommentResponse {
    data: Comment[];
    pagination: {
        total: number;
        limit: number;
        hasNextPage: boolean;
        nextCursor: string | null;
    };
}

export interface CreateCommentInput {
    content: string;
}

export interface UpdateCommentInput {
    content: string;
}