import PostDetailScreen from "@/app/_screens/PostDetail";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function PostDetailRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <PostDetailScreen postId={decodeURIComponent(id ?? "")} />;
}
