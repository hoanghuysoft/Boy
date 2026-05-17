# Global Audio Player System

This project uses a centralized audio playback system managed via **Zustand** and **react-native-nitro-player**. It ensures that only one audio track plays at a time across the entire application (posts, profile headers, music sheets, etc.).

## Key Components

| File | Role |
|------|------|
| `stores/audio.ts` | Zustand store — single source of truth for playback state |
| `components/GlobalAudioPlayer.tsx` | Invisible component at the root (`app/_layout.tsx`) that bridges the store to the nitro player |

---

## How It Works Internally

`GlobalAudioPlayer` maintains a **single persistent playlist** (`__global__`) inside `react-native-nitro-player`. Every call to `playTrack` swaps the one track in that playlist and calls `TrackPlayer.playSong()`. Progress and state events from nitro-player are pushed back into the Zustand store via hooks.

```
useAudioStore.playTrack()
      ↓
GlobalAudioPlayer (useEffect detects URL change)
      ↓
PlayerQueue.removeTrackFromPlaylist  ← remove old track
PlayerQueue.addTrackToPlaylist       ← add new track (with optional artwork)
PlayerQueue.loadPlaylist
TrackPlayer.playSong
      ↓
useOnPlaybackProgressChange  →  useAudioStore.setPlaybackStatus()
useOnPlaybackStateChange     →  stopPlayback() on natural end
```

---

## Public API (unchanged for callers)

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

`artwork` / `coverUrl` is **optional** — the player works fine without an image.

```tsx
const { playTrack } = useAudioStore();

// With artwork
playTrack(trackId, item.audio_url, {
  title: item.title,
  artist: item.artist,
  coverUrl: item.cover_url,   // optional
});

// Without artwork
playTrack(trackId, item.audio_url, {
  title: item.title,
  artist: item.artist,
});

// Minimal (no metadata at all)
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
      coverUrl: item.cover_url,  // omit if unavailable
    });
  }
};
```

### 6. Read playback progress

```tsx
const { currentTime, duration } = useAudioStore();
const progress = duration > 0 ? currentTime / duration : 0;  // 0–1
```

---

## Zustand Store Shape

```ts
interface AudioStore {
  // Identity
  currentlyPlayingId: string | null;
  currentAudioUrl: string | null;
  metadata: { title?: string; artist?: string; coverUrl?: string } | null;

  // Progress (updated by GlobalAudioPlayer)
  currentTime: number;   // seconds
  duration: number;      // seconds

  // Actions
  playTrack(id: string, url: string, metadata?: AudioMetadata): void;
  stopPlayback(): void;
  setPlaybackStatus(currentTime: number, duration: number): void;
  // (lower-level setters also available if needed)
}
```

---

## Best Practices

- **Stable, namespaced IDs** — prefix by content type to avoid collisions:
  - Posts: `post-${id}`
  - Profile music: `profile-music-${id}`
  - Music sheet: `music-sheet-${id}`
- **Cleanup on dismiss** — call `stopPlayback()` when a sheet/modal that contains audio is closed.
- **Always provide metadata** — even without artwork. The `title` and `artist` fields appear in the native OS notification/lock-screen controls.
- **Artwork is optional** — `coverUrl` can be omitted; nitro-player accepts `artwork: null`.

---

## Native Notification / Lock-Screen Controls

Because `react-native-nitro-player` integrates with the OS media session, the metadata passed to `playTrack` is automatically shown in:
- **Android** — notification player and lock-screen controls
- **iOS** — Control Centre and lock-screen controls (CarPlay if configured)

No extra configuration is needed for basic notification controls. To enable Android Auto or CarPlay, call `TrackPlayer.configure()` at app startup (see `nitro-player.md`).
