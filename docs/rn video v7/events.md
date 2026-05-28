[Skip to main content](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/#__docusaurus_skipToContent_fallback)

Version: v7 Beta

On this page

The `VideoPlayer` emits a variety of events that allow you to monitor and react to changes in its state and playback.

## Using the `useEvent` Hook [​](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/\#using-the-useevent-hook "Direct link to using-the-useevent-hook")

For React functional components, the `useEvent` hook provides a convenient way to subscribe to player events and automatically manage cleanup.

```typescript
import { useVideoPlayer, useEvent } from 'react-native-video';
import { useEffect } from 'react';

const MyVideoComponent = () => {
  const player = useVideoPlayer('https://example.com/video.mp4', (_player) => {
    _player.play();
  });

  useEvent(player, 'onLoad', (data) => {
    console.log('Video loaded via useEvent! Duration:', data.duration);
  });

  useEvent(player, 'onProgress', (data) => {
    console.log('Progress via useEvent:', data.currentTime);
  });

  // For onError, which is a direct property on VideoPlayer, not from VideoPlayerEvents
  useEvent(player, 'onError', (error) => {
    console.error('Player Error via useEvent:', error.code, error.message);
  });

  return <VideoView player={player} />;
};
```

## Available Events [​](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/\#available-events "Direct link to Available Events")

The `VideoPlayer` class, through `VideoPlayerEvents`, supports the following events. You can subscribe to these by assigning a callback function to the corresponding property on the `VideoPlayer` instance.

| Event | Callback Signature | Description |
| --- | --- | --- |
| `onAudioBecomingNoisy` | () =\> void | Fired when audio is about to become noisy (e.g., headphones unplugged). |
| `onAudioFocusChange` | (hasAudioFocus: boolean) => void | Fired when the audio focus changes (e.g., another app starts playing audio). |
| `onBandwidthUpdate` | (data: [BandwidthData](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/BandwidthData)) =\> void | Fired with an estimate of the available bandwidth. |
| `onBuffer` | (buffering: boolean) => void | Fired when the player starts or stops buffering data. |
| `onControlsVisibleChange` | (visible: boolean) => void | Fired when the visibility of native controls changes. |
| `onEnd` | () =\> void | Fired when the video playback reaches the end. |
| `onExternalPlaybackChange` | (externalPlaybackActive: boolean) => void | Fired when the external playback status changes (e.g., AirPlay). |
| `onLoad` | (data: [onLoadData](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/onLoadData)) =\> void | Fired when the video has loaded and is ready to play. |
| `onLoadStart` | (data: [onLoadStartData](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/onLoadStartData)) =\> void | Fired when the video starts loading. |
| `onPlaybackRateChange` | (rate: number) => void | Fired when the playback rate changes. |
| `onPlaybackStateChange` | (data: [onPlaybackStateChangeData](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/onPlaybackStateChangeData)) =\> void | Fired when the playback state changes (e.g., playing, paused, stopped). |
| `onProgress` | (data: [onProgressData](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/onProgressData)) =\> void | Fired periodically during playback with the current time. |
| `onReadyToDisplay` | () =\> void | Fired when the player is ready to display the first frame of the video. |
| `onSeek` | (seekTime: number) => void | Fired when a seek operation has completed. |
| `onStatusChange` | (status: [VideoPlayerStatus](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/type-aliases/VideoPlayerStatus)) =\> void | Fired when the player status changes (detailed status updates). |
| `onTextTrackDataChanged` | (texts: string\[\]) => void | Fired when text track data (e.g., subtitles) changes. |
| `onTimedMetadata` | (metadata: [TimedMetadata](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/TimedMetadata)) =\> void | Fired when timed metadata is encountered in the video stream. |
| `onTrackChange` | (track: [TextTrack](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/TextTrack) \| null) => void | Fired when the selected text track changes. |
| `onVolumeChange` | (data: [onVolumeChangeData](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/onVolumeChangeData)) =\> void | Fired when the volume changes. |

Additionally, the `VideoPlayer` instance itself has an `onError` property:

- `onError: (error:` [VideoRuntimeError](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/api-reference/interfaces/VideoRuntimeError)`) => void` \- Fired when an error occurs. The callback receives the `VideoRuntimeError` object.

**Benefits of `useEvent`**:

- **Automatic Cleanup**: The event listener is automatically removed when the component unmounts or when the `player`, `event`, or `callback` dependencies change, preventing memory leaks.
- **Type Safety**: Provides better type inference for event callback parameters.

This hook is recommended for managing event subscriptions in a declarative React style.

### Initialization Timing and Events [​](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/\#initialization-timing-and-events "Direct link to Initialization Timing and Events")

`onLoadStart` / `onLoad` will fire automatically after construction when `initializeOnCreation` (default `true`) is enabled. If you set `initializeOnCreation: false`, these events will not fire until you call `initialize()` or `preload()`. Attach your event handlers before invoking those methods to avoid missing early events.

## Subscribing to Events [​](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/\#subscribing-to-events "Direct link to Subscribing to Events")

You can subscribe to an event by assigning a function to the player instance's corresponding property:

```typescript
import { VideoPlayer } from 'react-native-video';

const player = new VideoPlayer('https://example.com/video.mp4');

player.addEventListener('onLoad', (data) => {
  console.log('Video loaded! Duration:', data.duration);
});

player.addEventListener('onProgress', (data) => {
  console.log('Current time:', data.currentTime);
});

player.addEventListener('onError', (error) => {
  console.error('Player Error:', error.code, error.message);
});

player.play();
```

## Clearing Events [​](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/\#clearing-events "Direct link to Clearing Events")

- The `player.clearEvent(eventName)` method can be used to clear a specific native event handler.
- When a player instance is no longer needed and `player.release()` is called, all event listeners are automatically cleared

- [Using the `useEvent` Hook](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/#using-the-useevent-hook)
- [Available Events](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/#available-events)
  - [Initialization Timing and Events](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/#initialization-timing-and-events)
- [Subscribing to Events](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/#subscribing-to-events)
- [Clearing Events](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/player/events/#clearing-events)

We are TheWidlarzGroup [Premium support →](https://docs.thewidlarzgroup.com/react-native-video/docs/v7/offer)