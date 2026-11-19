# Google Sign-In Migration Notes

## Current State

The project has been migrated from `@react-native-google-signin/google-signin` to `@novastera-oss/rn-google-signin`.
Both packages remain in `package.json` — the old one is kept for easy restoration.

---

## Do You Need google-services.json / GoogleService-Info.plist?

### Android — `google-services.json`
**Not required** for the current setup.  
`webClientId` is passed manually in `viewmodels/RootLayoutViewModel.ts`, so the new lib does not need
to auto-detect it from a file. The new lib only reads `google-services.json` as a fallback when no
`webClientId` is provided in `configure()`.

### iOS — `GoogleService-Info.plist`
**Required** for iOS to work.  
Without an `iosClientId` in `configure()` and without the plist file, iOS sign-in will fail.
You have two options:
- **Option A (recommended):** Place `GoogleService-Info.plist` in the project root (same level as `app.json`)
  and add `"googleServicesFile": "./GoogleService-Info.plist"` to the `ios` block in `app.json`.
  The lib auto-detects `CLIENT_ID` from it.
- **Option B:** Add `iosClientId` explicitly in `configure()`:
  ```ts
  RnGoogleSignin.configure({
      webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
      iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
  });
  ```

---

## How to Restore the Old Library

### Step 1 — `services/login.ts`

Swap the imports and revert method calls:

```ts
// Uncomment:
import { GoogleSignin } from "@react-native-google-signin/google-signin";
// Comment out:
// import RnGoogleSignin from "@novastera-oss/rn-google-signin";
```

Revert method calls:
```ts
// signInWithGoogle()
await GoogleSignin.hasPlayServices();           // remove {}
const userInfo = await GoogleSignin.signIn();   // remove {}
if (userInfo.data?.idToken) { ... }             // restore .data?.idToken
token: userInfo.data.idToken,                   // restore .data.

// signOut()
await GoogleSignin.signOut();
```

### Step 2 — `viewmodels/RootLayoutViewModel.ts`

```ts
// Uncomment:
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// Comment out:
// import RnGoogleSignin from '@novastera-oss/rn-google-signin';

// Revert configure call:
GoogleSignin.configure({
    webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
});
```

### Step 3 — `app.json`

In the `plugins` array, swap:
```json
"@novastera-oss/rn-google-signin"
```
back to:
```json
"@react-native-google-signin/google-signin"
```

---

## Key Differences Between the Two Libraries

| | `@react-native-google-signin/google-signin` | `@novastera-oss/rn-google-signin` |
|---|---|---|
| Architecture | Old bridge + New Architecture | New Architecture (TurboModules) only |
| Min RN version | Any | 0.79+ |
| Import style | Named: `{ GoogleSignin }` | Default: `RnGoogleSignin` |
| Method params | No params needed: `signIn()` | Must pass object: `signIn({})` |
| Response shape | `userInfo.data.idToken` | `userInfo.idToken` |
| Android API | Legacy Sign-In | Credential Manager |
| `isSignedIn()` Android | Works silently | May trigger credential picker UI |
| Custom scopes Android | Supported | Not supported |

---

## Migrating to 3.0.0

The package was upgraded from `^2.0.2` to `^3.0.0`. Key notes and impact on this project:

1. **Android `user.id` now returns Google account ID (`sub`) instead of email:**
   - Matches iOS behavior.
   - **App Impact:** None. In this app, `userInfo.idToken` is forwarded directly to Supabase (`supabase.auth.signInWithIdToken`), and account identity is managed through Supabase's user UUID. We never stored or relied on Google's `userInfo.user.id`.

2. **Android `signIn()` opens the account chooser by default:**
   - In 3.0.0, `signIn({})` opens the full account chooser including "Add another account".
   - To use the previous One Tap bottom sheet instead, pass `{ oneTap: true }`.
   - `signInWithGoogle({ oneTap?: boolean })` in `services/login.ts` now supports toggling this option.

3. **Android `hasPlayServices({})`:**
   - No longer throws when `showPlayServicesUpdateDialog` is omitted. Safe with `await RnGoogleSignin.hasPlayServices({})`.

4. **Android `play-services-auth` 22.0.0:**
   - Removed legacy `GoogleSignIn` / `GoogleSignInClient` APIs. This app only uses `@novastera-oss/rn-google-signin`, so there are no conflicts.

5. **iOS GoogleSignIn 10.1 & Dependencies:**
   - Requires iOS 15.0+ (the project targets iOS 16+ on Expo SDK 57).
   - Removed unused `GoogleSignInSwiftSupport` pod dependency.
   - Run `pod update GoogleSignIn` or let Expo prebuild/EAS install during native builds.

6. **iOS `getTokens()`:**
   - Rejects with `sign_in_required` when the refresh token has expired (not used directly; Supabase handles session refresh via `autoRefreshToken: true`).

