import { useSettingsStore } from "@/stores/settings";
import ProfileScreen from "../_screens/Profile";
import ProfileNew from "../_screens/ProfileNew";

export default function ProfileRoute() {
    const profileDesign = useSettingsStore(s => s.profileDesign);
    if (profileDesign === 'new') {
        return <ProfileNew />;
    }
    return <ProfileScreen />;
}
