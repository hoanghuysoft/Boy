# Global Audio Player System

This project uses a centralized audio playback system managed via **Zustand** and **expo-audio**. This ensures that only one audio track plays at a time across the entire application (e.g., between Post items, Profile headers, and Music sheets).

## Key Components

1.  **`stores/audio.ts`**: The Zustand store that holds the global state of the player.
2.  **`components/GlobalAudioPlayer.tsx`**: A invisible component mounted at the root (`app/_layout.tsx`) that listens to the store and performs the actual audio playback.

---

## How to Use

### 1. Access the Store
Import the hook in your component:

```tsx
import { useAudioStore } from '@/stores/audio';
```

### 2. Check Playback Status
To see if a specific item is playing, use the `currentlyPlayingId` from the store:

```tsx
const { currentlyPlayingId } = useAudioStore();

// Use a unique ID for your item
const trackId = `my-track-${item.id}`;
const isPlaying = currentlyPlayingId === trackId;
```

### 3. Play a Track
Use the `playTrack` action. It takes the ID, the audio URL, and optional metadata:

```tsx
const { playTrack } = useAudioStore();

const handlePlay = () => {
  playTrack(trackId, item.preview_url, {
    title: item.title,
    artist: item.artist,
    coverUrl: item.cover_url,
  });
};
```

### 4. Stop Playback
Use the `stopPlayback` action:

```tsx
const { stopPlayback } = useAudioStore();

const handleStop = () => {
  stopPlayback();
};
```

### 5. Toggle Pattern (Recommended)
Most components implement a toggle logic like this:

```tsx
const toggleMusic = () => {
    if (isPlaying) {
        stopPlayback();
    } else {
        playTrack(trackId, url, { title, artist, coverUrl });
    }
};
```

---

## Best Practices

-   **Stable IDs**: Always use a unique prefix for your IDs to avoid collisions between different types of content (e.g., `post-123`, `profile-music-456`, `music-sheet-789`).
-   **Cleanup**: If a view contains a lot of audio items (like a Sheet), consider calling `stopPlayback()` when the view is dismissed to ensure the app doesn't keep playing audio unexpectedly.
-   **Metadata**: Always provide metadata when playing. This allows future enhancements like a global "Now Playing" bar.
