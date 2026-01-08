import { Post } from "@/types/post";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "./client";

export const getFeed = async (type: "random" | "on_this_day", limit: number = 10, offset: number = 0): Promise<Post[]> => {
  const response = await client.get("/api/posts", {
    params: {
      type,
      limit,
      offset,
    },
  });
  return response.data.data;
};

export const useFeed = (type: "random" | "on_this_day") => {
  return useInfiniteQuery({
    queryKey: ["feed", type],
    queryFn: ({ pageParam }) => getFeed(type, 10, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length * 10 : undefined;
    },
  });
};