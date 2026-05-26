import { useSettingsStore } from "@/stores/settings";
import ProfileScreen from "../_screens/Profile";
import ProfileV3 from "../_screens/ProfileV3";

export default function ProfileRoute() {
    const profileDesign = useSettingsStore(s => s.profileDesign);
    if (profileDesign === 'v3') {
        return <ProfileV3 />;
    }
    return <ProfileScreen />;
}
