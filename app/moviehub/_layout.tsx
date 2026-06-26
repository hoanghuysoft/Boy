import Stack from "expo-router/stack";

export default function MovieHubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="video_detail" />
      <Stack.Screen name="gallery_sub" />
    </Stack>
  );
}
