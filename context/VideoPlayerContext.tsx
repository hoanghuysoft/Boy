/**
 * VideoPlayerContext
 *
 * Lazily provides a shared VideoPlayer instance only when requested, and
 * registers with videoCache so that clearVideoCacheAsync / setVideoCacheSizeAsync
 * are never blocked by an idle global VideoPlayer instance.
 */
import { registerCachePlayerPool } from "@/services/videoCache";
import { createVideoPlayer, VideoPlayer } from "expo-video";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

interface VideoPlayerContextValue {
  getPlayer: () => VideoPlayer;
  activeOwnerIdRef: React.RefObject<string | null>;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

export const VideoPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const playerRef = useRef<VideoPlayer | null>(null);
  const activeOwnerIdRef = useRef<string | null>(null);

  const getPlayer = useCallback((): VideoPlayer => {
    if (!playerRef.current) {
      playerRef.current = createVideoPlayer(null);
    }
    return playerRef.current;
  }, []);

  useEffect(() => {
    const unregister = registerCachePlayerPool({
      releasePlayersForCacheOp: () => {
        if (playerRef.current) {
          try {
            playerRef.current.release();
          } catch { }
          playerRef.current = null;
          activeOwnerIdRef.current = null;
        }
      },
    });

    return () => {
      unregister();
      if (playerRef.current) {
        try {
          playerRef.current.release();
        } catch { }
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <VideoPlayerContext.Provider value={{ getPlayer, activeOwnerIdRef }}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useGlobalVideoPlayer = (): VideoPlayer => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error("useGlobalVideoPlayer must be inside VideoPlayerProvider");
  return ctx.getPlayer();
};

export const useGlobalVideoPlayerOwner = (): React.RefObject<string | null> => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error("useGlobalVideoPlayerOwner must be inside VideoPlayerProvider");
  return ctx.activeOwnerIdRef;
};
