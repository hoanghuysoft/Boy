# react-native-gemini-nano

> On-device AI for React Native — powered by **Gemini Nano** (Android) and **Apple Foundation Models** (iOS 26+)

[![npm version](https://img.shields.io/npm/v/react-native-gemini-nano.svg?style=flat-square)](https://www.npmjs.com/package/react-native-gemini-nano)
[![npm downloads](https://img.shields.io/npm/dm/react-native-gemini-nano.svg?style=flat-square)](https://www.npmjs.com/package/react-native-gemini-nano)
[![license](https://img.shields.io/npm/l/react-native-gemini-nano.svg?style=flat-square)](./LICENSE)
[![platform - android](https://img.shields.io/badge/platform-Android-3DDC84?style=flat-square&logo=android)](https://developer.android.com)
[![platform - ios](https://img.shields.io/badge/platform-iOS%2026%2B-000000?style=flat-square&logo=apple)](https://developer.apple.com)

---

## What is this?

`react-native-gemini-nano` is a **Turbo Module** (New Architecture) that brings fully **on-device** generative AI to your React Native app — no API key, no internet connection, no cloud costs.

| Platform | Engine | Minimum |
|----------|--------|---------|
| Android | Google AI Edge — Gemini Nano (AICore) | **Pixel 8 / 8a / 8 Pro or newer only** |
| iOS | Apple Foundation Models | iOS 26.0+ |

> ⚠️ **Android device requirement:** Gemini Nano runs via Google's AICore, which is only available on **Pixel 8 series and above**. Samsung Galaxy, OnePlus, Xiaomi, and other Android devices are **not supported** — Samsung uses its own proprietary Galaxy AI (Samsung Gauss) which does not expose a public SDK.

All inference runs **locally on the device**. Your users' prompts never leave their phone.

---

## Installation

```sh
npm install react-native-gemini-nano
# or
yarn add react-native-gemini-nano
```

### Expo

Add the config plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": ["react-native-gemini-nano"]
  }
}
```

Then rebuild your dev client:

```sh
npx expo prebuild
npx expo run:android
npx expo run:ios
```

> **Note:** This library requires the **New Architecture**. It does not work with Expo Go — use a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

### Bare React Native

**iOS**

```sh
cd ios && pod install
```

**Android**

No extra steps. The Google AI Edge SDK is bundled automatically.

### Enable New Architecture

```js
// android/gradle.properties
newArchEnabled=true
```

```ruby
# ios/Podfile
:new_arch_enabled => true
```

---

## Usage

### Check availability

Always check whether the on-device model is available before generating text.

```ts
import { isAvailable, generateText } from 'react-native-gemini-nano';

const supported = await isAvailable();

if (!supported) {
  console.log('Gemini Nano is not available on this device.');
}
```

### Generate text

```ts
const response = await generateText('Explain black holes in one sentence.', {
  temperature: 0.7,  // 0.0 = deterministic, 1.0 = creative (default: 0.7)
  maxTokens: 256,    // max output tokens (default: 256)
});

console.log(response);
```

### Full example

```tsx
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { isAvailable, generateText } from 'react-native-gemini-nano';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');

  async function run() {
    const ok = await isAvailable();
    if (!ok) return setResult('Not available on this device.');
    const text = await generateText(prompt, { temperature: 0.8 });
    setResult(text);
  }

  return (
    <View>
      <TextInput value={prompt} onChangeText={setPrompt} placeholder="Ask anything..." />
      <Button title="Generate" onPress={run} />
      <Text>{result}</Text>
    </View>
  );
}
```

---

## API

### `isAvailable(): Promise<boolean>`

Returns `true` if the on-device model is ready to use on the current device.

| Return | Description |
|--------|-------------|
| `true` | Model is available — safe to call `generateText` |
| `false` | Device not supported or model not downloaded |

---

### `generateText(prompt, options?): Promise<string>`

Runs inference on-device and returns the generated text.

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | `string` | The input text / instruction |
| `options` | `GeminiNanoOptions` | Optional generation settings |

**`GeminiNanoOptions`**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `temperature` | `number` | `0.7` | Controls randomness. `0` = focused, `1` = creative |
| `maxTokens` | `number` | `256` | Maximum number of output tokens |

---

## Platform Notes

### Android

- Requires **Google Pixel 8 / 8a / 8 Pro or newer** — AICore is a Google-exclusive feature
- **Samsung Galaxy, OnePlus, Xiaomi, and other Android OEMs are not supported**
- Samsung devices use Galaxy AI (Samsung Gauss), which is proprietary and has no public developer SDK
- Uses `com.google.ai.edge.aicore` SDK
- Model is pre-installed by Google Play Services — no download required
- `isAvailable()` returns `false` gracefully on unsupported devices

### iOS

- Requires **iOS 26.0** or later
- Uses Apple's **FoundationModels** framework (`LanguageModelSession`)
- On older iOS, `isAvailable()` returns `false` gracefully

---

## New Architecture

This library requires the **React Native New Architecture** (Turbo Modules + JSI). The legacy bridge is not supported.

---

## Contributing

Contributions are welcome! Please read the [development workflow](CONTRIBUTING.md#development-workflow) before submitting a PR.

---

## License

MIT © [jonadan](https://github.com/jonadan)

---

<p align="center">
  Built with <a href="https://github.com/callstack/react-native-builder-bob">create-react-native-library</a>
</p>
# react-native-gemini-nano
