export interface IComment {
    id: number;
    userName: string;
    avatarUrl: string;
    commentText: string;
    likes: string;
    timeAgo: string;
}

export const mockComments: IComment[] = [
    {
        id: 1,
        userName: "Alex Johnson",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
        commentText: "This video is amazing! Love the editing and the style.",
        likes: "124",
        timeAgo: "2 hours ago"
    },
    {
        id: 2,
        userName: "Sara Miller",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sara",
        commentText: "Great content. Subscribed and looking forward to more videos like this.",
        likes: "87",
        timeAgo: "5 hours ago"
    },
    {
        id: 3,
        userName: "Michael Brown",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Michael",
        commentText: "Who is watching this in 2026? Such a masterpiece.",
        likes: "342",
        timeAgo: "1 day ago"
    },
    {
        id: 4,
        userName: "Emma Watson",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma",
        commentText: "Can anyone tell me the background song name? It is so good.",
        likes: "12",
        timeAgo: "3 days ago"
    }
];
