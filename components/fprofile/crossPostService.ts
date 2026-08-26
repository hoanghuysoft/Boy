/**
 * Cross-Post Service for X/Twitter statuses
 *
 * Implements 3 distinct cross-posting media modes:
 *  1. 'x_url'       — Use direct X/Twitter CDN URL without re-uploading
 *  2. 'third_party' — Download media and upload to third-party cloud
 *  3. 'welove_cloud'— Download media and upload to official WeLove cloud
 */

import { Directory, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { getOrDownloadFile } from "@/services/fileCacheUtils";
import {
  createMediaRecord,
  FileAsset,
  smartUpload,
} from "@/services/mediaUpload";
import { createPost, CreatePostInput } from "@/services/post";
import { uploadToThirdParty } from "@/services/thirdPartyUpload";
import { Post } from "@/types/post";

export type CrossPostMode = "x_url" | "third_party" | "welove_cloud";

export interface CrossPostProgress {
  current: number;
  total: number;
  progress: number;
  statusText: string;
}

export async function executeCrossPost(
  myProfileId: string,
  post: Post,
  mode: CrossPostMode,
  onProgress?: (progress: CrossPostProgress) => void
): Promise<Post> {
  const mediaList = post.media || [];
  const mediaIds: string[] = [];
  const tempDir = new Directory(Paths.cache, "crosspost_temp");

  if (mediaList.length > 0) {
    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i];
      const mediaType = media.type === "video" ? "video" : "photo";

      onProgress?.({
        current: i + 1,
        total: mediaList.length,
        progress: (i / mediaList.length) * 100,
        statusText: `Processing media ${i + 1}/${mediaList.length}...`,
      });

      if (mode === "x_url") {
        // Mode 1: Use direct X/Twitter CDN media URL
        const record = await createMediaRecord(myProfileId, media.url, mediaType, {
          thumbnail_url: media.thumbnail_url || media.url,
          blurhash: media.blurhash,
          caption: media.caption || "",
        });
        mediaIds.push(record.data.id);
      } else if (mode === "third_party") {
        // Mode 2: Download then upload to third-party cloud
        const ext = mediaType === "video" ? "mp4" : "jpg";
        const downloaded = await getOrDownloadFile(
          media.url,
          tempDir,
          `crosspost_${post.id}_${i}.${ext}`
        );

        const fileAsset: FileAsset = {
          uri: downloaded.uri,
          name: downloaded.name,
          type: mediaType === "video" ? "video/mp4" : "image/jpeg",
        };

        const uploadRes = await uploadToThirdParty(fileAsset);
        const record = await createMediaRecord(
          myProfileId,
          uploadRes.url,
          mediaType,
          {
            thumbnail_url: uploadRes.thumbnailUrl || uploadRes.url,
            width: uploadRes.width,
            height: uploadRes.height,
            blurhash: uploadRes.blurhash || media.blurhash,
            caption: media.caption || "",
          }
        );
        mediaIds.push(record.data.id);
      } else if (mode === "welove_cloud") {
        // Mode 3: Download then upload to official WeLove Cloud storage
        const ext = mediaType === "video" ? "mp4" : "jpg";
        const downloaded = await getOrDownloadFile(
          media.url,
          tempDir,
          `crosspost_${post.id}_${i}.${ext}`
        );

        const fileAsset: FileAsset = {
          uri: downloaded.uri,
          name: downloaded.name,
          type: mediaType === "video" ? "video/mp4" : "image/jpeg",
        };

        const uploadRes = await smartUpload(myProfileId, fileAsset, {
          type: mediaType,
          blurhash: media.blurhash,
          caption: media.caption || "",
        });
        mediaIds.push(uploadRes.data.id);
      }
    }
  }

  onProgress?.({
    current: mediaList.length,
    total: mediaList.length,
    progress: 100,
    statusText: "Publishing post to WeLove...",
  });

  // Construct new post input
  const postData: CreatePostInput = {
    content: post.content ? post.content.trim() : undefined,
    location: typeof post.location === "string" ? post.location : post.location?.name,
    links: post.links && post.links.length > 0 ? post.links : undefined,
    is_ghost: false,
    is_adult: post.is_adult,
    media_ids: mediaIds.length > 0 ? mediaIds : undefined,
    device: Platform.OS,
  };

  const response = await createPost(myProfileId, postData);
  return response.data;
}
