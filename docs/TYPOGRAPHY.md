# Material Design Typography System

A comprehensive typography system following Material Design 2 and Material Design 3 guidelines, with responsive scaling for cross-device consistency.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Material Design Scales](#material-design-scales)
- [Using Typography in Components](#using-typography-in-components)
- [Responsive Scaling](#responsive-scaling)
- [API Reference](#api-reference)
- [Examples](#examples)

## Overview

The typography system provides:

- ✅ **Material Design 2** and **Material Design 3** type scales
- ✅ **Responsive font scaling** based on screen width
- ✅ **Theme-aware** typography that adapts to light/dark modes
- ✅ **Type-safe** TypeScript definitions
- ✅ **Consistent design** across all screens

## Quick Start

### Basic Usage

```tsx
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../styles/common";

const MyComponent = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <View>
      <Text style={common.headline}>Main Heading</Text>
      <Text style={common.body}>Body text content</Text>
      <Text style={common.caption}>Small caption text</Text>
    </View>
  );
};
```

### Direct Typography Access

```tsx
import { useThemeContext } from "../../context/ThemeContext";
import { createTextStyle } from "../styles/typography";

const MyComponent = () => {
  const { colors, typography } = useThemeContext();

  return (
    <View>
      <Text style={createTextStyle(typography.displayLarge, colors.text)}>
        Display Text
      </Text>
      <Text style={createTextStyle(typography.headlineMedium, colors.text)}>
        Headline
      </Text>
    </View>
  );
};
```

## Material Design Scales

### Switching Between M2 and M3

The theme context provides a `typographyScale` state that can be switched between Material Design 2 and Material Design 3:

```tsx
import { useThemeContext } from "../../context/ThemeContext";

const SettingsScreen = () => {
  const { typographyScale, setTypographyScale } = useThemeContext();

  return (
    <View>
      <Text>Current Scale: {typographyScale}</Text>
      <Button 
        title="Switch to M2" 
        onPress={() => setTypographyScale("m2")} 
      />
      <Button 
        title="Switch to M3" 
        onPress={() => setTypographyScale("m3")} 
      />
    </View>
  );
};
```

### Material Design 2 Type Scale

| Style | Font Size | Weight | Line Height | Use Case |
|-------|-----------|--------|-------------|----------|
| `h1` | 96px | Light (300) | 115px | Large display text |
| `h2` | 60px | Light (300) | 72px | Display headings |
| `h3` | 48px | Regular (400) | 58px | Section headings |
| `h4` | 34px | Regular (400) | 41px | Page titles |
| `h5` | 24px | Regular (400) | 29px | Subsection titles |
| `h6` | 20px | Medium (500) | 24px | Card titles |
| `subtitle1` | 16px | Regular (400) | 24px | List subtitles |
| `subtitle2` | 14px | Medium (500) | 21px | Secondary subtitles |
| `body1` | 16px | Regular (400) | 24px | Body text |
| `body2` | 14px | Regular (400) | 21px | Secondary body |
| `caption` | 12px | Regular (400) | 18px | Captions, hints |
| `button` | 14px | Medium (500) | 21px | Button text |
| `overline` | 10px | Regular (400) | 15px | Overline text |

### Material Design 3 Type Scale

| Style | Font Size | Weight | Line Height | Use Case |
|-------|-----------|--------|-------------|----------|
| `displayLarge` | 57px | Regular (400) | 64px | Large display |
| `displayMedium` | 45px | Regular (400) | 52px | Medium display |
| `displaySmall` | 36px | Regular (400) | 44px | Small display |
| `headlineLarge` | 32px | Regular (400) | 40px | Large headlines |
| `headlineMedium` | 28px | Regular (400) | 36px | Medium headlines |
| `headlineSmall` | 24px | Regular (400) | 32px | Small headlines |
| `titleLarge` | 22px | Medium (500) | 28px | Large titles |
| `titleMedium` | 16px | Medium (500) | 24px | Medium titles |
| `titleSmall` | 14px | Medium (500) | 20px | Small titles |
| `bodyLarge` | 16px | Regular (400) | 24px | Large body text |
| `bodyMedium` | 14px | Regular (400) | 20px | Medium body text |
| `bodySmall` | 12px | Regular (400) | 16px | Small body text |
| `labelLarge` | 14px | Medium (500) | 20px | Large labels |
| `labelMedium` | 12px | Medium (500) | 16px | Medium labels |
| `labelSmall` | 11px | Medium (500) | 16px | Small labels |

## Using Typography in Components

### Using Common Styles (Recommended)

The `createCommonStyles` function provides pre-configured typography styles with colors:

```tsx
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../styles/common";

const ArticleScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <View style={common.screen}>
      <Text style={common.display}>Article Title</Text>
      <Text style={common.headline}>Section Heading</Text>
      <Text style={common.body}>
        This is the main body text of the article. It uses Material Design
        typography for consistent spacing and readability.
      </Text>
      <Text style={common.caption}>Published on January 1, 2024</Text>
    </View>
  );
};
```

### Available Common Styles

| Style | Description | Material Design Equivalent |
|-------|-------------|---------------------------|
| `display` | Large display text | M3: `displayLarge`, M2: `h1` |
| `headline` | Headline text | M3: `headlineLarge`, M2: `h4` |
| `heading` | Heading (alias for title) | M3: `titleLarge`, M2: `h6` |
| `title` | Title text | M3: `titleLarge`, M2: `h6` |
| `subheading` | Subheading text | M3: `titleMedium`, M2: `subtitle1` |
| `body` | Body text | M3: `bodyLarge`, M2: `body1` |
| `bodySmall` | Small body text | M3: `bodySmall`, M2: `body2` |
| `label` | Label text | M3: `labelLarge`, M2: `button` |
| `buttonText` | Button text | M3: `labelLarge`, M2: `button` |
| `caption` | Caption text | M3: `bodySmall`, M2: `caption` |
| `muted` | Muted text (70% opacity) | Based on `bodySmall`/`body2` |

### Custom Typography Styles

For more control, access typography directly:

```tsx
import { useThemeContext } from "../../context/ThemeContext";
import { createTextStyle } from "../styles/typography";

const CustomText = () => {
  const { colors, typography } = useThemeContext();

  return (
    <View>
      {/* Using M3 styles */}
      <Text style={createTextStyle(typography.displayLarge, colors.text)}>
        Custom Display
      </Text>
      
      {/* With overrides */}
      <Text style={createTextStyle(
        typography.headlineMedium, 
        colors.text,
        { textAlign: "center", marginTop: 16 }
      )}>
        Centered Headline
      </Text>
      
      {/* M2 styles (when scale is "m2") */}
      <Text style={createTextStyle(typography.h1, colors.text)}>
        H1 Heading
      </Text>
    </View>
  );
};
```

## Responsive Scaling

The typography system automatically scales fonts based on screen width:

- **Base width**: 375px (iPhone X/11/12 standard)
- **Scaling**: Fonts scale proportionally with screen width
- **Limits**: Fonts are clamped between 12px minimum and 1.5x the base size maximum

### How It Works

```tsx
// On a 375px wide device (base)
fontSize: 16px → 16px

// On a 414px wide device (iPhone Pro Max)
fontSize: 16px → ~17.7px

// On a 768px wide device (iPad)
fontSize: 16px → ~32.8px (clamped to 24px max)
```

The scaling ensures readability across all device sizes while maintaining design consistency.

## API Reference

### `createTypography(scale?: TypographyScale)`

Creates a typography object with Material Design styles.

**Parameters:**
- `scale` (optional): `"m2"` or `"m3"` - Default: `"m3"`

**Returns:** Typography object with all Material Design styles plus convenience aliases.

**Example:**
```tsx
import { createTypography } from "../styles/typography";

const m3Typography = createTypography("m3");
const m2Typography = createTypography("m2");
```

### `createTextStyle(typographyStyle, color, overrides?)`

Creates a complete text style with color and optional overrides.

**Parameters:**
- `typographyStyle`: TextStyle object from typography system
- `color`: Text color string
- `overrides` (optional): Partial TextStyle for additional properties

**Returns:** Complete TextStyle object

**Example:**
```tsx
import { createTextStyle } from "../styles/typography";

const style = createTextStyle(
  typography.headlineLarge,
  colors.text,
  { textAlign: "center", marginTop: 8 }
);
```

### `createCommonStyles(colors, typography)`

Creates reusable styles including typography with colors applied.

**Parameters:**
- `colors`: ThemeColors object from theme context
- `typography`: Typography object from `createTypography`

**Returns:** StyleSheet object with all common styles

**Example:**
```tsx
import { createCommonStyles } from "../styles/common";

const { colors, typography } = useThemeContext();
const common = createCommonStyles(colors, typography);
```

## Examples

### Profile Screen Example

```tsx
import { View, Text, Image } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../styles/common";

const ProfileScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <View style={common.screen}>
      <View style={common.screenPadding}>
        <Image source={avatar} style={common.avatarLarge} />
        
        <Text style={common.heading}>John Doe</Text>
        <Text style={common.muted}>@johndoe</Text>
        
        <Text style={[common.body, { marginTop: 16 }]}>
          Software developer passionate about creating beautiful user experiences.
        </Text>
        
        <View style={[common.card, { marginTop: 16 }]}>
          <Text style={common.subheading}>About</Text>
          <Text style={common.body}>
            Detailed information about the user goes here...
          </Text>
        </View>
      </View>
    </View>
  );
};
```

### Card Component Example

```tsx
import { View, Text, TouchableOpacity } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../styles/common";

const Card = ({ title, description, onPress }) => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <TouchableOpacity 
      style={common.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={common.title}>{title}</Text>
      <Text style={[common.body, { marginTop: 8 }]}>{description}</Text>
      <Text style={[common.buttonText, { marginTop: 12 }]}>
        Learn More
      </Text>
    </TouchableOpacity>
  );
};
```

### Form Example

```tsx
import { View, Text, TextInput } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../styles/common";

const FormField = ({ label, value, onChangeText }) => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={common.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[
          common.body,
          {
            borderWidth: 1,
            borderColor: colors.card,
            borderRadius: 8,
            padding: 12,
            marginTop: 4,
          },
        ]}
      />
    </View>
  );
};
```

### Typography Showcase

```tsx
import { ScrollView, Text, View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../styles/common";

const TypographyShowcase = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  return (
    <ScrollView style={common.screen}>
      <View style={common.screenPadding}>
        <Text style={common.display}>Display Text</Text>
        <Text style={common.headline}>Headline Text</Text>
        <Text style={common.title}>Title Text</Text>
        <Text style={common.subheading}>Subheading Text</Text>
        <Text style={common.body}>
          Body text - This is the standard body text used throughout the app.
          It provides good readability for longer content.
        </Text>
        <Text style={common.bodySmall}>
          Small body text - Used for secondary information or compact layouts.
        </Text>
        <Text style={common.label}>Label Text</Text>
        <Text style={common.caption}>Caption Text</Text>
        <Text style={common.muted}>Muted Text (70% opacity)</Text>
      </View>
    </ScrollView>
  );
};
```

## Best Practices

1. **Use Common Styles**: Prefer `createCommonStyles` for consistency
2. **Choose Appropriate Scale**: Use M3 for modern apps, M2 for legacy compatibility
3. **Maintain Hierarchy**: Use display → headline → title → body → caption hierarchy
4. **Respect Line Heights**: Don't override line heights unless necessary
5. **Theme Awareness**: Always use colors from theme context for text colors
6. **Responsive Design**: Trust the scaling system - don't manually adjust font sizes

## Troubleshooting

### Fonts not scaling correctly

Ensure you're using the typography system and not hardcoded font sizes:

```tsx
// ❌ Bad
<Text style={{ fontSize: 16 }}>Text</Text>

// ✅ Good
<Text style={common.body}>Text</Text>
```

### Typography not updating when switching scales

Make sure you're recreating styles when typography changes:

```tsx
// ✅ Good - styles recreate when typography changes
const { colors, typography } = useThemeContext();
const common = createCommonStyles(colors, typography);
```

### Text color not matching theme

Always use colors from theme context:

```tsx
// ❌ Bad
<Text style={[common.body, { color: "#000" }]}>Text</Text>

// ✅ Good
<Text style={common.body}>Text</Text>
```

## Additional Resources

- [Material Design 2 Typography](https://material.io/design/typography/the-type-system.html)
- [Material Design 3 Typography](https://m3.material.io/styles/typography/overview)

