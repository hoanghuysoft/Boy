import { useThemeContext } from '@/context/ThemeContext';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

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
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(explore)">
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}