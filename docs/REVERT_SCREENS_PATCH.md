# How to Revert the React Native Screens Patch

This document explains how to revert the native patch applied to `react-native-screens` and return your project to the original state.

## 1. Discard Project Changes
Remove the registered patch file and revert the configurations changed by the patch system:

```bash
# Delete the patch file
rm patches/react-native-screens@4.25.2.patch

# Revert package.json and bun.lock changes
git checkout package.json bun.lock
```

## 2. Restore Original Library Source
Remove the modified package from `node_modules` and perform a clean install to fetch the unmodified source code from the registry:

```bash
# Remove the modified library directory
rm -rf node_modules/react-native-screens

# Re-install dependencies
bun install
```

## 3. Rebuild Native Application (Required)
Since the native code was modified, you need to compile a new build of your application:

```bash
# Rebuild for Android local dev client
bunx expo run:android

# Or run EAS build
eas build --platform android --profile development
```
