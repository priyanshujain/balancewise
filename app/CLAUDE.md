# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BalanceWise is an Expo/React Native application using expo-router for file-based routing. The project is configured to run on iOS, Android, and web platforms, with React Native's new architecture enabled.

## Development Commands

### Starting the Development Server
```bash
npm start              # Start Expo dev server with options menu
npm run ios           # Start on iOS simulator
npm run android       # Start on Android emulator
npm run web           # Start web version
```

### Code Quality
```bash
npm run lint          # Run ESLint (expo-config preset)
```

### Project Reset
```bash
npm run reset-project # Move current app to app-example/ and create blank app/
```

## Architecture

### Routing with expo-router

This project uses **file-based routing** where the file structure in `app/` determines routes:

- `app/_layout.tsx` - Root layout with Stack navigator and ThemeProvider
- `app/(tabs)/_layout.tsx` - Tab navigator layout
- `app/(tabs)/index.tsx` - Home screen (route: "/")
- `app/(tabs)/explore.tsx` - Explore screen (route: "/explore")
- `app/modal.tsx` - Modal screen (route: "/modal")

**Key routing concepts:**
- Folders wrapped in parentheses like `(tabs)` are route groups that don't appear in the URL
- `_layout.tsx` files define layouts and navigation structure for that directory
- `experiments.typedRoutes: true` is enabled in app.json for type-safe navigation
- The `unstable_settings.anchor` in `app/_layout.tsx` sets the default route

### Theme System

The app has a comprehensive theming system supporting light and dark modes:

**Color Definitions:** `constants/theme.ts`
- `Colors.light` and `Colors.dark` objects define all app colors
- Font families are platform-specific (iOS uses SF Pro, others use System)

**Theme Hooks:**
- `useColorScheme()` - Detects system theme (light/dark)
- `useThemeColor(props, colorName)` - Resolves theme colors with optional overrides

**Themed Components:**
- `ThemedText` - Text with automatic theme colors and predefined variants (default, title, subtitle, link, defaultSemiBold)
- `ThemedView` - View container with automatic background theming
- Components accept `lightColor` and `darkColor` props to override theme defaults

The root layout (`app/_layout.tsx`) wraps the app in React Navigation's `ThemeProvider` based on the detected color scheme.

### Component Structure

**Location and Organization:**
- `components/` - Reusable components
- `components/ui/` - Platform-specific UI components (use `.ios.tsx`, `.android.tsx`, or `.web.tsx` suffixes when needed)
- `hooks/` - Custom React hooks (also use platform suffixes when needed)
- `constants/` - App-wide constants like colors and fonts

**Key Components:**
- `ParallaxScrollView` - Animated scroll view with header image that parallaxes
- `Collapsible` - Expandable/collapsible section with chevron icon
- `ExternalLink` - Opens URLs in system browser via expo-web-browser
- `HapticTab` - Tab bar button with haptic feedback (iOS only, gracefully degrades)
- `IconSymbol` - Cross-platform icon using SF Symbols on iOS, Ionicons elsewhere

**Component Patterns:**
- All components use TypeScript with strict mode
- Styles are defined inline using `StyleSheet.create()`
- Components are functional with hooks (no class components)
- Platform-specific code uses separate files (e.g., `icon-symbol.ios.tsx` and `icon-symbol.tsx`)

### Animation & Interaction

- **Reanimated:** Use `react-native-reanimated` for animations (already imported in `app/_layout.tsx`)
- **Gestures:** `react-native-gesture-handler` is available for gesture handling
- **Haptics:** Use `expo-haptics` for iOS haptic feedback (check feature availability first)

### Path Aliases

TypeScript is configured with the `@/*` path alias pointing to the project root:
```typescript
import { useThemeColor } from '@/hooks/use-theme-color';
```

## Configuration Files

- `app.json` - Expo configuration (name, version, plugins, platform settings)
  - `newArchEnabled: true` - React Native new architecture is enabled
  - `experiments.reactCompiler: true` - React Compiler optimizations enabled
- `tsconfig.json` - TypeScript strict mode, path aliases
- `eslint.config.js` - Expo's ESLint preset

## Platform-Specific Code

When creating platform-specific implementations:

1. Create separate files with platform extensions:
   - `component.ios.tsx` - iOS version
   - `component.android.tsx` - Android version
   - `component.web.tsx` - Web version
   - `component.tsx` - Default/fallback version

2. Import normally - Metro bundler automatically selects the correct file:
   ```typescript
   import IconSymbol from '@/components/ui/icon-symbol'; // Gets .ios.tsx on iOS
   ```

## State Management

This is a starter template with no global state management library (Redux, Zustand, etc.). For adding state management, consider the app's needs and choose accordingly.

## Notable Dependencies

- `expo-router` - File-based routing and navigation
- `react-native-reanimated` - High-performance animations
- `react-native-gesture-handler` - Touch gesture system
- `expo-symbols` - SF Symbols on iOS (Material Icons fallback)
- `expo-haptics` - Haptic feedback (iOS)
- `react-native-safe-area-context` - Safe area handling for notches/home indicators
