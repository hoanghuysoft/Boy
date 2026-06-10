// Chat endpoint (`GET /chat`)

export interface ChatMessage {
    id: string;
    uid: string;
    time: number;
    date: string;
    name: string;
    body: string;
    avatar_url: string | null;
    is_admin: boolean;
}

export interface ChatResponse {
    messages: ChatMessage[];
}
