# Global Audio Player System

This project uses a centralized audio playback system managed via **Zustand** and **`expo-audio`** (Expo SDK 56). It ensures that only one audio track plays at a time across the entire application (posts, profile headers, music sheets, etc.), with full background playback support and native lock screen / notification media controls.

## Key Components

| File | Role |
|------|------|
| `stores/audio.ts` | Zustand store — single source of truth for playback state |
| `components/GlobalAudioPlayer.tsx` | Invisible component at root (`app/_layout.tsx`) that manages `expo-audio` player, background audio session, lock screen controls, and syncs status back to Zustand |

---

## How It Works Internally

`GlobalAudioPlayer` uses `useAudioPlayer` and `useAudioPlayerStatus` from `expo-audio`:

1. **Audio Session Setup**: Configures `setAudioModeAsync` on mount with `playsInSilentMode: true`, `shouldPlayInBackground: true`, and `interruptionMode: 'doNotMix'`.
2. **Lock Screen & Media Notification**: When `currentAudioUrl` is set, `player.setActiveForLockScreen(true, metadata, options)` is called. On Android, this binds to the Foreground Media Playback Service (`AudioControlsService`), ensuring **sustained background playback** beyond the 3-minute OS limit.
3. **Playback Updates**: Status events update `currentTime`, `duration`, and `isPlaying` in the Zustand store.
4. **Natural Completion & Teardown**: When a track finishes naturally (`status.didJustFinish`), lock screen controls are deactivated (`setActiveForLockScreen(false)`) and the store is reset.

```
useAudioStore.playTrack()
      ↓
GlobalAudioPlayer (useEffect detects audio URL & metadata change)
      ↓
player.setActiveForLockScreen(true, { title, artist, albumTitle, artworkUrl })
player.play()  ← plays indefinitely in background with OS media controls
      ↓
useAudioPlayerStatus  →  useAudioStore.setPlaybackStatus(currentTime, duration, isPlaying)
status.didJustFinish   →  player.setActiveForLockScreen(false) & stopPlayback()
```

---

## Public API (for callers)

### 1. Import the store

```tsx
import { useAudioStore } from '@/stores/audio';
```

### 2. Check if a specific item is playing

```tsx
const { currentlyPlayingId } = useAudioStore();

const trackId = `post-${item.id}`;       // use a unique namespaced ID
const isPlaying = currentlyPlayingId === trackId;
```

### 3. Play a track

`artworkUrl` / `coverUrl` is **optional** — the player works fine without an image.

```tsx
const { playTrack } = useAudioStore();

// With artwork & metadata
playTrack(trackId, item.audio_url, {
  title: item.title,
  artist: item.artist,
  albumTitle: item.album_title, // optional
  artworkUrl: item.cover_url,   // optional (coverUrl also supported)
});

// Without artwork
playTrack(trackId, item.audio_url, {
  title: item.title,
  artist: item.artist,
});

// Minimal
playTrack(trackId, item.audio_url);
```

### 4. Stop playback

```tsx
const { stopPlayback } = useAudioStore();
stopPlayback();
```

### 5. Toggle pattern (recommended)

```tsx
const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();
const trackId = `profile-music-${item.id}`;
const isPlaying = currentlyPlayingId === trackId;

const toggleMusic = () => {
  if (isPlaying) {
    stopPlayback();
  } else {
    playTrack(trackId, item.audio_url, {
      title: item.title,
      artist: item.artist,
      artworkUrl: item.cover_url,
    });
  }
};
```

### 6. Read playback progress

```tsx
const { currentTime, duration, isPlaying } = useAudioStore();
const progress = duration > 0 ? currentTime / duration : 0;  // 0–1
```

---

## Zustand Store Shape

```ts
export interface AudioMetadata {
  title?: string;
  artist?: string;
  albumTitle?: string;
  artworkUrl?: string;
  coverUrl?: string;
}

interface AudioStore {
  // Identity
  currentlyPlayingId: string | null;
  currentAudioUrl: string | null;
  metadata: AudioMetadata | null;

  // Progress (updated by GlobalAudioPlayer)
  currentTime: number;   // seconds
  duration: number;      // seconds
  isPlaying: boolean;

  // Actions
  playTrack(id: string, url: string, metadata?: AudioMetadata): void;
  stopPlayback(): void;
  setPlaybackStatus(currentTime: number, duration: number, isPlaying?: boolean): void;
}
```

---

## Background Playback & Lock Screen Configuration

1. **Config Plugin (`app.json`)**:
   ```json
   "plugins": [
     [
       "expo-audio",
       {
         "enableBackgroundPlayback": true
       }
     ]
   ]
   ```
2. **Android Permissions**:
   - `android.permission.FOREGROUND_SERVICE`
   - `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK`
   - `android.permission.POST_NOTIFICATIONS`
3. **iOS Background Modes**:
   - `audio` background mode (automatically set by `expo-audio` plugin when `enableBackgroundPlayback: true`)
4. **Lock Screen Controls**:
   - On **Android**, `setActiveForLockScreen(true, ...)` starts the foreground media service to prevent the 3-minute background kill limitation and renders the notification controls in the drawer.
   - On **iOS**, `shouldPlayInBackground: true` enables audio in background, and `setActiveForLockScreen` provides lock screen & Control Center media controls.

