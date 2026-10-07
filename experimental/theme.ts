const experimental_profile_username = "@buituan.welove";

export const fourhands = {
    logo: require("@/assets/theme/fourhands/logo.png"),
    avatar_frame: require("@/assets/theme/fourhands/avatar.png"),
    card_assets: [
        require("@/assets/theme/fourhands/note (1).webp"),
        require("@/assets/theme/fourhands/note (2).webp"),
        require("@/assets/theme/fourhands/note (3).webp"),
        require("@/assets/theme/fourhands/note (4).webp"),
        require("@/assets/theme/fourhands/note (5).webp"),
        require("@/assets/theme/fourhands/note (6).webp"),
        require("@/assets/theme/fourhands/note (7).webp"),
        require("@/assets/theme/fourhands/note (8).webp"),
        require("@/assets/theme/fourhands/note (9).webp"),
        require("@/assets/theme/fourhands/note (10).webp"),
        require("@/assets/theme/fourhands/note (11).webp"),
        require("@/assets/theme/fourhands/key-blank-ticket.png"),
    ],
    cover: require("@/assets/theme/fourhands/cover.jpg"),
    audio: require("@/assets/theme/fourhands/themeaudio.mp3")
};

export function checkAvailability(username?: string | null): boolean {
    if (!username) return false;
    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    const cleanTarget = experimental_profile_username.replace(/^@/, '').trim().toLowerCase();
    return cleanUsername === cleanTarget;
}