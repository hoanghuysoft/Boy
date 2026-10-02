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

For sheets with long scrollable lists, use fractional detents (`0` to `1`) and set `scrollable: true`:

```tsx
globalTrueSheet.open({
  detents: [0.5, 0.9],
  scrollable: true,
  header: (
    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>Select Item</Text>
    </View>
  ),
  content: ({ dismiss }) => (
    <ScrollView style={{ padding: 16 }}>
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

> [!WARNING]
> **Never combine `'auto'` with `scrollable: true`.**
> Content auto-measuring and scrolling containers are fundamentally incompatible in bottom sheets. If you set `scrollable: true`, provide fractional detents like `[0.6, 1]`. The system automatically handles fallback if `'auto'` is accidentally passed.

---

### 2. Fixed Native Header and Footer

Use the `header` and `footer` props — they render in dedicated native container slots with automatic layout and keyboard handling:

```tsx
globalTrueSheet.open({
  detents: [0.6, 1],
  header: (
    <View style={{ padding: 16, backgroundColor: '#f9f9f9' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Fixed Top Header</Text>
    </View>
  ),
  content: ({ resize }) => (
    <View style={{ padding: 16 }}>
      <Text>Scrollable or static body content...</Text>
      <Button title="Expand to Full Height" onPress={() => resize(1)} />
    </View>
  ),
  footer: ({ dismiss }) => (
    <View style={{ padding: 16, borderTopWidth: 1, borderColor: '#e5e5e5' }}>
      <Button title="Confirm Action" onPress={() => dismiss()} />
    </View>
  ),
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
| `detents` | `(number \| 'auto')[]` | `['auto']` | Up to 3 height stops. Sorted smallest to largest. |
| `cornerRadius` | `number` | `24` | Top corner radius in pt. |
| `grabber` | `boolean` | `true` | Whether to show the top drag pill. |
| `grabberOptions`| `GrabberOptions` | `{ color }` | Custom grabber color, width, height, or margin. |
| `dimmed` | `boolean` | `true` | Dim backdrop behind sheet. |
| `dimmedDetentIndex` | `number` | `undefined` | Only dim backdrop above a specific detent index. |
| `dismissible` | `boolean` | `true` | Allows user dismissal by swiping down or tapping backdrop. |
| `draggable` | `boolean` | `true` | Allows user dragging between detents. |
| `scrollable` | `boolean` | `false` | Enables nested native scrolling. |
| `backgroundBlur`| `string` | `undefined` | iOS blur material (e.g. `'system-material'`). |
| `backgroundColor`| `string` | Theme default | Custom sheet background color. |
| `initialDetentIndex`| `number` | `0` | Starting detent index on present. |
| `style` | `StyleProp<ViewStyle>` | `undefined` | Custom styling for the native sheet wrapper. |
| `contentContainerStyle`| `StyleProp<ViewStyle>` | `undefined` | Custom styling for the content inner container. |

---

## 🎯 Best Practices Checklist

1. **Detents Limit**: Maximum of **3 detents** per sheet.
2. **`resize()` takes an index**: `resize(1)` means *"go to detent index 1"*, not a pixel or percentage.
3. **TextInput Handling**: Do not use `autoFocus` on inputs inside sheets. Instead, focus the input in `onDidPresent`:
   ```tsx
   globalTrueSheet.open({
     content: <Input autoFocus={false} />,
     onDidPresent: () => inputRef.current?.focus()
   });
   ```
4. **Theme Integration**: `GlobalTrueSheet` automatically consumes `useThemeContext()` for surface backgrounds and grabber outlines unless custom colors are supplied.
