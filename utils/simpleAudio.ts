import { AudioSource, createAudioPlayer } from "expo-audio";

/**
 * playSimpleSound - Fire-and-forget helper for one-shot sound effects
 * (e.g. notifications, button clicks, pop sounds) without managing state.
 *
 * @param source AudioSource, remote URL string, or local asset require(..)
 * @returns The AudioPlayer instance
 *
 * @example
 * playSimpleSound(require('../assets/sounds/pop.mp3'));
 * playSimpleSound('https://example.com/sound.mp3');
 */
export function playSimpleSound(source: AudioSource | string | number) {
    try {
        const player = createAudioPlayer(source);
        const sub = player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) {
                try {
                    sub.remove();
                    player.pause();
                } catch {}
            }
        });
        player.play();
        return player;
    } catch (err) {
        console.warn("[playSimpleSound] Error playing sound:", err);
        return null;
    }
}
