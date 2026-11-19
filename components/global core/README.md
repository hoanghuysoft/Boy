# Global TrueSheet Guide

A high-performance, store-driven, reusable bottom sheet system for React Native and Expo powered by [`@lodev09/react-native-true-sheet`](https://github.com/lodev09/react-native-true-sheet) and [Zustand](https://github.com/pmndrs/zustand).

---

## 🚀 Quick Start

### 1. Simple Imperative Call (Anywhere in the App)

You can trigger a bottom sheet from **any component, helper, or event handler** without passing refs or managing local state:

```tsx
import { globalTrueSheet } from '@/components/global core/truesheet';
import { View, Text, Button } from 'react-native';

export function ExampleButton() {
  const handleOpen = () => {
    globalTrueSheet.open({
      detents: ['auto'],
      content: ({ dismiss }) => (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Hello World</Text>
          <Text style={{ marginTop: 8, color: '#666' }}>
            This sheet is rendered via the global Zustand controller.
          </Text>
          <Button title="Close" onPress={() => dismiss()} />
        </View>
      ),
    });
  };

  return <Button title="Open Sheet" onPress={handleOpen} />;
}
```

---

## 📚 Core Features & Recipes

### 1. Multi-Stop & Scrollable Lists

For sheets with scrollable lists, pass a ref to the scrollable via `scrollableRef`. For fixed detents, pass `style: { flex: 1 }` so the content fills the sheet's visible height per detent (`'auto'` detents also work natively with `scrollableRef` without `flex: 1`):

```tsx
const scrollRef = useRef<ScrollView>(null);

globalTrueSheet.open({
  detents: [0.5, 0.9],
  style: { flex: 1 },
  scrollableRef: scrollRef,
  header: (
    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>Select Item</Text>
    </View>
  ),
  content: ({ dismiss }) => (
    <ScrollView ref={scrollRef} style={{ flex: 1, padding: 16 }}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => {
            selectItem(item);
            dismiss();
          }}
          style={{ paddingVertical: 12 }}
        >
          <Text>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  ),
});
```

> [!NOTE]
> In TrueSheet v4, `'auto'` detents work with `scrollableRef` — no fallback is needed, and the bottom safe-area inset is handled natively.

---

### 2. Fixed Native Header and Footer

Use `header` and `footer` — they render in dedicated native containers. By default both use `position: 'relative'` (taking space above/below content and included in `'auto'` height), and the footer absorbs the bottom safe-area inset natively. Use `footerOptions={{ position: 'absolute' }}` when you want the footer to float over content and rise above the keyboard:

```tsx
globalTrueSheet.open({
  detents: [0.6, 1],
  style: { flex: 1 },
  header: (
    <View style={{ padding: 16, backgroundColor: '#f9f9f9' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Fixed Top Header</Text>
    </View>
  ),
  content: ({ resize }) => (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Scrollable or static body content...</Text>
      <Button title="Expand to Full Height" onPress={() => resize(1)} />
    </View>
  ),
  footer: ({ dismiss }) => (
    <View style={{ padding: 16, borderTopWidth: 1, borderColor: '#e5e5e5' }}>
      <Button title="Confirm Action" onPress={() => dismiss()} />
    </View>
  ),
  footerOptions: { position: 'relative' },
});
```

---

### 3. Dynamic In-Sheet Content Swapping

Change the layout or transition steps **inside the exact same open sheet** without opening a new one:

```tsx
globalTrueSheet.open({
  detents: ['auto'],
  content: ({ setContent, dismiss }) => (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 16 }}>Step 1: Choose Action</Text>
      <Button
        title="Proceed to Step 2"
        onPress={() => {
          setContent(
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 16 }}>Step 2: Confirmation</Text>
              <Button title="Finish" onPress={() => dismiss()} />
            </View>
          );
        }}
      />
    </View>
  ),
});
```

---

### 4. Native Stacking (Sheets on top of Sheets)

Push a new sheet on top of an existing one. Dismissing the top sheet automatically restores the previous sheet underneath without losing state:

```tsx
globalTrueSheet.open({
  detents: ['auto'],
  content: ({ push, dismiss }) => (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Main Sheet</Text>
      
      <Button
        title="Open Details (Stacked) >"
        onPress={() => {
          // Push a 2nd sheet on top of the 1st
          push({
            detents: ['auto'],
            content: ({ pop, dismissAll }) => (
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Stacked Child Sheet</Text>
                
                {/* Pops only this top sheet, revealing the main sheet */}
                <Button title="< Back to Main Sheet" onPress={() => pop()} />
                
                {/* Closes all sheets in the stack */}
                <Button title="Close Everything" onPress={() => dismissAll()} />
              </View>
            ),
          });
        }}
      />
    </View>
  ),
});
```

---

## 🛠️ API Reference

### `globalTrueSheet` Imperative Methods

| Method | Signature | Description |
| :--- | :--- | :--- |
| `open` | `(options: GlobalTrueSheetOpenOptions) => Promise<string>` | Opens a base sheet (replaces active stack by default). |
| `push` | `(options: GlobalTrueSheetOpenOptions) => Promise<string>` | Pushes a new sheet on top of the active stack. |
| `pop` | `(animated?: boolean) => Promise<void>` | Dismisses the top-most sheet. |
| `dismiss` | `(sheetId?: string, animated?: boolean) => Promise<void>` | Dismisses a specific sheet or the top sheet. |
| `dismissStack` | `(sheetId?: string, animated?: boolean) => Promise<void>` | Dismisses all sheets stacked *on top* of the target sheet. |
| `dismissAll` | `(animated?: boolean) => Promise<void>` | Closes all open sheets across the entire app. |
| `resize` | `(index: number, sheetId?: string) => Promise<void>` | Snaps sheet to a detent by index (`0`, `1`, `2`). |
| `setContent` | `(content: GlobalTrueSheetContent, sheetId?: string) => void` | Updates sheet content dynamically. |
| `setHeader` | `(header: GlobalTrueSheetContent \| null, sheetId?: string) => void` | Updates sheet header dynamically. |
| `setFooter` | `(footer: GlobalTrueSheetContent \| null, sheetId?: string) => void` | Updates sheet footer dynamically. |
| `updateConfig` | `(config: Partial<GlobalTrueSheetConfig>, sheetId?: string) => void` | Modifies configuration props on the fly. |
| `isOpen` | `() => boolean` | Returns `true` if any sheet is currently open. |
| `getStackCount` | `() => number` | Returns the total count of active stacked sheets. |

---

### `GlobalTrueSheetHelpers` (Passed to render callbacks)

When passing a function to `content`, `header`, or `footer`, it receives the following helpers:

```tsx
content: ({
  dismiss,       // Closes this sheet
  pop,           // Same as dismiss
  push,          // Pushes a child sheet on top
  dismissStack,  // Closes children stacked on top of this sheet
  dismissAll,    // Closes all sheets
  resize,        // Snaps to detent index: resize(1)
  setContent,    // Updates body JSX
  setHeader,     // Updates header JSX
  setFooter,     // Updates footer JSX
  updateConfig,  // Modifies sheet props
  sheetId,       // Unique ID string
  stackIndex     // 0 for base sheet, 1 for first child, etc.
}) => <YourView />
```

---

### Configuration Options (`GlobalTrueSheetConfig`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `detents` | `SheetDetent[]` | `['auto']` | Up to 3 height stops (`'auto'`, `'peek'`, or `0`–`1`), sorted smallest to largest. |
| `cornerRadius` | `number` | `36` | Top corner radius in pt. |
| `grabber` | `boolean` | `true` | Whether to show the top drag pill. |
| `grabberOptions`| `GrabberOptions` | `{ color }` | Custom grabber color, width, height, or margin. |
| `dimmed` | `boolean` | `true` | Dim backdrop behind sheet. |
| `dimmedDetentIndex` | `number` | `undefined` | Only dim backdrop above a specific detent index. |
| `dismissible` | `boolean` | `true` | Allows user dismissal by swiping down or tapping backdrop. |
| `draggable` | `boolean` | `true` | Allows user dragging between detents. |
| `scrollableRef` | `RefObject<...>` | `undefined` | Ref to the inner `ScrollView` / `FlatList` / `FlashList` / `LegendList`. |
| `scrollableOptions` | `ScrollableOptions` | `undefined` | Fine-tune scroll expansion, keyboard offset, and content inset adjustment. |
| `headerOptions` | `HeaderOptions` | `{ position: 'relative' }` | Header layout position (`'relative'` or `'absolute'`). |
| `footerOptions` | `FooterOptions` | `{ position: 'relative' }` | Footer layout position and keyboard avoidance. |
| `backgroundBlur`| `string` | `undefined` | iOS blur material (e.g. `'system-material'`). |
| `backgroundColor`| `ColorValue` | Theme default | Custom sheet background color. |
| `backgroundStyle` | `StyleProp<Pick<ViewStyle, 'backgroundColor'>>` | `undefined` | Exact color or glass/blur tint above sheet effects. |
| `insetAdjustment` | `'automatic' \| 'never'` | `'automatic'` | Native bottom safe-area inset adjustment. |
| `initialDetentIndex`| `number` | `undefined` | Starting detent index on initial mount. |
| `style` | `StyleProp<ViewStyle>` | `undefined` | Content container style (`{ flex: 1 }` required to fill fixed detents). |
| `contentContainerStyle`| `StyleProp<ViewStyle>` | `undefined` | Custom styling for an optional inner wrapper View. |

---

## 🎯 Best Practices Checklist

1. **Detents Limit**: Maximum of **3 detents** per sheet, sorted smallest to largest.
2. **`resize()` takes an index**: `resize(1)` means *"go to detent index 1"*, not a pixel or percentage.
3. **Content Layout & Safe Areas**: v4 content wraps naturally by default — pass `style: { flex: 1 }` for fixed-detent scrollables or `flex: 1` children. Do not add manual `insets.bottom` padding inside `footer` or `scrollableRef` scroll content (v4 applies safe-area insets natively).
4. **TextInput Handling**: `autoFocus` on a `TextInput` raises the keyboard natively with the sheet when lazy-mounted (default). With `lazy: false`, focus inside `onWillPresent` or `onDidPresent`.
5. **Theme Integration**: `GlobalTrueSheet` automatically consumes `useThemeContext()` for surface backgrounds and grabber outlines unless custom colors are supplied.
