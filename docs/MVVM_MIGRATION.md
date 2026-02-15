# MVVM Migration Guide

This guide explains how to migrate existing screens from the current monolithic pattern to **MVVM (Model-View-ViewModel)** architecture.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  VIEW (Screen Component)                             │
│  app/_screens/Xxx.tsx                                │
│  ─────────────────────                               │
│  • JSX rendering only                                │
│  • StyleSheet definitions                            │
│  • Navigation (useRouter)                            │
│  • Theme (useThemeContext)                            │
│  • Consumes ViewModel: const vm = useXxxViewModel()  │
│  • NO useState, NO useEffect, NO business logic      │
└────────────────────┬─────────────────────────────────┘
                     │ uses
┌────────────────────▼─────────────────────────────────┐
│  VIEWMODEL (Custom Hook)                             │
│  viewmodels/XxxViewModel.ts                          │
│  ──────────────────────                              │
│  • All useState / useRef                             │
│  • All useEffect (side effects)                      │
│  • Data fetching (React Query hooks)                 │
│  • Computed/derived values (useMemo)                 │
│  • Event handlers (useCallback)                      │
│  • Animations (Reanimated shared values)             │
│  • Returns a clean API object for the View           │
└────────────────────┬─────────────────────────────────┘
                     │ uses
┌────────────────────▼─────────────────────────────────┐
│  MODEL (Existing layers — no changes needed)         │
│  ──────────────────────                              │
│  • services/*.ts     → API calls + React Query hooks │
│  • types/*.ts        → TypeScript interfaces         │
│  • stores/*.ts       → Zustand global stores         │
│  • context/*.tsx     → React Context providers       │
└──────────────────────────────────────────────────────┘
```

### When to use what

| State type | Where it lives |
|---|---|
| Screen-local state (search query, form inputs, loading) | **ViewModel** (`useState` inside the hook) |
| Shared/global state (scroll triggers, auth) | **Zustand store** (`stores/`) |
| Server data (profiles, posts, media) | **React Query** (`services/`) |
| Theme, auth context | **React Context** (`context/`) |

---

## Step-by-Step Migration

### Step 1: Identify what to extract

Open your screen file (e.g. `app/_screens/Home.tsx`) and categorize everything:

**Goes to ViewModel (viewmodels/HomeViewModel.ts):**
- ✅ All `useState` declarations
- ✅ All `useRef` declarations (except refs used only in JSX like `ref={scrollRef}`)
- ✅ All `useEffect` hooks
- ✅ All `useMemo` for computed data
- ✅ All `useCallback` handler functions
- ✅ React Query hooks (`useInfiniteX`, `useQuery`, `useMutation`)
- ✅ Zustand store subscriptions (`useScrollStore`, etc.)
- ✅ Reanimated shared values and animated styles
- ✅ Keyboard listeners
- ✅ Layout calculations

**Stays in View (app/_screens/Home.tsx):**
- ✅ JSX rendering / return statement
- ✅ `StyleSheet.create()`
- ✅ `useRouter()` (navigation)
- ✅ `useThemeContext()` (theme/colors/typography)
- ✅ `createCommonStyles()` (common styles)
- ✅ `useSafeAreaInsets()` — *can stay in View OR move to ViewModel*
- ✅ Render helper functions (renderItem, renderEmpty, etc.)

### Step 2: Create the ViewModel file

Create `viewmodels/XxxViewModel.ts`:

```ts
// viewmodels/HomeViewModel.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// ... import services, stores, types as needed

export const useHomeViewModel = () => {
  // ─── State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("feed");
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<any>(null);

  // ─── Data ──────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteFeed();

  const posts = useMemo(() => {
    return data?.pages.flatMap((p) => p.data) || [];
  }, [data]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // ─── Side Effects ──────────────────────────────────────────────
  useEffect(() => {
    // Any initialization logic
  }, []);

  // ─── Return ────────────────────────────────────────────────────
  return {
    // State
    activeTab,
    refreshing,
    posts,
    isLoading,
    isFetchingNextPage,

    // Refs
    listRef,

    // Handlers
    handleRefresh,
    handleEndReached,
    handleTabChange,
  };
};
```

### Step 3: Refactor the View

Update your screen to consume the ViewModel:

```tsx
// app/_screens/Home.tsx
import { useHomeViewModel } from "../../viewmodels/HomeViewModel";

const HomeScreen = () => {
  const navigation = useRouter();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  // All logic comes from the ViewModel
  const vm = useHomeViewModel();

  // Render helpers — these are pure UI, so they stay here
  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostItem post={item} />
    ),
    [colors, common]
  );

  return (
    <View style={common.screen}>
      {vm.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlashList
          ref={vm.listRef}
          data={vm.posts}
          renderItem={renderPost}
          refreshing={vm.refreshing}
          onRefresh={vm.handleRefresh}
          onEndReached={vm.handleEndReached}
        />
      )}
    </View>
  );
};
```

### Step 4: Verify the migration

After migrating, check that your screen file has:

- ❌ No `useState` calls
- ❌ No `useEffect` calls
- ❌ No direct React Query hooks
- ❌ No business logic (calculations, filtering, sorting)
- ✅ Only `useRouter`, `useThemeContext`, `createCommonStyles`
- ✅ Only `const vm = useXxxViewModel()`
- ✅ Only JSX and render functions

---

## Real Example: Search Screen

### Before (monolithic)
```
app/_screens/Search.tsx    → 453 lines (state + effects + handlers + UI)
```

### After (MVVM)
```
viewmodels/SearchViewModel.ts  → 195 lines (all logic)
app/_screens/Search.tsx        → 310 lines (pure UI)
```

### What moved to SearchViewModel:

| What | From View | To ViewModel |
|---|---|---|
| `useState` (searchQuery, debouncedSearchQuery, isFocused) | ✅ | → `useSearchViewModel()` |
| `useInfiniteProfiles()` | ✅ | → returns `profiles`, `isLoading`, etc. |
| `useMemo` (profiles, totalResults) | ✅ | → returns computed values |
| `debounce` handler | ✅ | → returns `handleSearchChange` |
| `clearSearch` | ✅ | → returns `clearSearch` |
| Keyboard animation (Reanimated) | ✅ | → returns `animatedSearchBarStyle` |
| Scroll-to-top trigger | ✅ | → handled internally |
| Image prefetching | ✅ | → handled internally |
| `handleRefresh` | ✅ | → returns `handleRefresh` |
| `handleEndReached` | ✅ | → returns `handleEndReached` |
| `inputRef`, `listRef` | ✅ | → returns refs for View to attach |

---

## Common Patterns

### Pattern: Passing parameters to ViewModel

When a screen receives route params:

```ts
// viewmodels/ProfileViewModel.ts
export const useProfileViewModel = (id: string, isMe: boolean) => {
  const { data: profile } = useProfile(id, isMe);
  // ...
  return { profile, ... };
};

// app/_screens/Profile.tsx
const params = useLocalSearchParams();
const id = Array.isArray(params.id) ? params.id[0] : params.id;
const isMe = params.isMe === "true";
const vm = useProfileViewModel(id, isMe);
```

### Pattern: ViewModel needs navigation

Navigation should stay in the **View**. If the ViewModel needs to trigger navigation, return a state flag:

```ts
// ❌ BAD — don't put useRouter in ViewModel
export const useCreateViewModel = () => {
  const router = useRouter(); // Don't do this
  const handleSubmit = () => {
    await submitPost();
    router.back(); // Don't do this
  };
};

// ✅ GOOD — return state, let View handle navigation
export const useCreateViewModel = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async () => {
    await submitPost();
    setIsSubmitted(true);
  };

  return { isSubmitted, handleSubmit };
};

// View
const vm = useCreateViewModel();
useEffect(() => {
  if (vm.isSubmitted) router.back();
}, [vm.isSubmitted]);
```

### Pattern: ViewModel with Zustand (shared state)

If the screen's state needs to be accessed globally:

```ts
// stores/searchStore.ts (instead of viewmodels/)
import { create } from "zustand";

interface SearchState {
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchHistory: [],
  addToHistory: (query) =>
    set((s) => ({ searchHistory: [query, ...s.searchHistory].slice(0, 10) })),
  clearHistory: () => set({ searchHistory: [] }),
}));
```

Then use it inside your ViewModel:

```ts
// viewmodels/SearchViewModel.ts
export const useSearchViewModel = () => {
  const { searchHistory, addToHistory } = useSearchStore();
  // ... combine with local state
};
```

---

## File Naming Convention

```
viewmodels/
  SearchViewModel.ts       ← for app/_screens/Search.tsx
  ProfileViewModel.ts      ← for app/_screens/Profile.tsx
  HomeViewModel.ts         ← for app/_screens/Home.tsx
  CreateViewModel.ts       ← for app/_screens/Create.tsx
  SettingsViewModel.ts     ← for app/_screens/Settings.tsx
```

**Rules:**
- One ViewModel per screen
- File named `XxxViewModel.ts` (not `.tsx` — ViewModels have no JSX)
- Exports a single hook: `useXxxViewModel`
- Returns a flat object (no nested objects)

---

## Migration Checklist

Use this checklist when migrating each screen:

- [ ] Create `viewmodels/XxxViewModel.ts`
- [ ] Move all `useState` to ViewModel
- [ ] Move all `useRef` to ViewModel
- [ ] Move all `useEffect` to ViewModel
- [ ] Move all `useMemo` / computed values to ViewModel
- [ ] Move all `useCallback` handlers to ViewModel
- [ ] Move React Query hooks to ViewModel
- [ ] Move Zustand store reads to ViewModel
- [ ] Move Reanimated shared values + animated styles to ViewModel
- [ ] Move keyboard/layout calculations to ViewModel
- [ ] Update View to use `const vm = useXxxViewModel()`
- [ ] Replace all direct state references with `vm.xxx`
- [ ] Replace all handler calls with `vm.handleXxx`
- [ ] Verify: View has NO `useState`, NO `useEffect`
- [ ] Verify: App still works correctly
