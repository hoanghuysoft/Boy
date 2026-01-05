import { Media } from "./media";
import { ProfileAddress } from "./profileaddress";
import { ProfileAvatar } from "./profileavatar";
import { ProfileLink } from "./profilelink";
import { ProfileMusic } from "./profilemusic";
import { Workplace } from "./profileworplace";

export interface ProfileDetail {
    id: string;
    user_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    bio: string | null;
    avatar_url: string;
    cover_url: string;
    created_at: string;
    updated_at: string;
    birthday: string | null;
    college: string | null;
    highschool: string | null;
    website: string | null;
    pronouns: string;
    gender: string;
    hometown: string | null;
    is_admin: boolean;
    photos: Media[];
    videos: Media[];
    avatars: ProfileAvatar[];
    social_links: ProfileLink[];
    music: ProfileMusic[];
    workplaces: Workplace[];
    addresses: ProfileAddress[];
}

export interface ProfileDetailResponse {
    data: ProfileDetail;
}

