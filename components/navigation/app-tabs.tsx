import { useThemeContext } from '@/context/ThemeContext';
import { NativeTabs } from 'expo-router/native-tabs';

export default function AppTabs() {
  const { colors } = useThemeContext();
  return (
    <NativeTabs
      backgroundColor={colors.surfaceContainer}
      indicatorColor={colors.secondaryContainer}
      iconColor={{ default: colors.onSurfaceVariant, selected: colors.onSecondaryContainer }}
      labelStyle={{
        default: { color: colors.onSurfaceVariant },
        selected: { color: colors.onSurface },
      }}
      minimizeBehavior="automatic">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/search.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="gallery">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/gallery.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Gallery</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/chat.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}