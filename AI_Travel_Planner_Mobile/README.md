# AI Travel Planner — Mobile

Premium React Native app (bare CLI, RN 0.86, **new architecture**) with a
glassmorphic UI: dreamy sky-blue gradients, frosted cards, Outfit + Inter
type, and a floating glass tab bar.

## Stack

| Concern | Library |
|---|---|
| Navigation | `@react-navigation/native` · native-stack · bottom-tabs |
| Auth | Firebase JS SDK (`firebase/auth`) + AsyncStorage persistence |
| HTTP | `axios` (Bearer Firebase ID token, base `/api/v1`) |
| Animation | `react-native-reanimated` v4 (+ worklets), RN `Animated` |
| Visuals | `react-native-linear-gradient`, `react-native-svg`, `lucide-react-native`, `lottie-react-native` |
| Storage | `@react-native-async-storage/async-storage` |

## Project structure

```
src/
  theme/         colors · typography · spacing/radius/shadow
  components/ui/ AppText · Button · Input · Card · Chip · GlassCard · GradientBackground
  lib/           env · firebase · api · authErrors
  context/       AuthContext (Firebase <-> backend profile)
  navigation/    RootNavigator · AuthNavigator · TabNavigator · GlassTabBar
  screens/       auth (Onboarding/SignIn/SignUp) · home · explore · trips · profile
  assets/        fonts (Outfit, Inter) · lottie
```

## Configure

Set the backend URL and Firebase web config in `src/lib/env.ts`:

```ts
export const API_BASE_URL = 'https://<your-deployed-backend>';
```

For local development against a device/emulator, use your machine's **LAN IP**
(e.g. `http://192.168.1.5:8080`) — not `localhost`.

## Run (development)

```bash
npm install
npm start                 # Metro
npm run android           # or: npm run ios (cd ios && pod install first)
```

## Build a release APK

> **Requirements (important):**
> - **JDK 17** — React Native's Gradle/AGP do not support newer JDKs. Point
>   `JAVA_HOME` at a 17 install (`brew install openjdk@17`).
> - **Android SDK** (Android Studio) with `ANDROID_HOME` set and platform 35.

```bash
cd android
./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

Fonts are already linked (via `react-native.config.js` + `react-native-asset`).
If you add more, drop them in `src/assets/fonts` and re-run `npx react-native-asset`.

## Notes

- The glass effect uses layered translucent fills (no fragile native blur
  module) so it builds cleanly on Android + iOS new architecture.
- Google Sign-In (native) and push notifications can be layered on later with a
  dev build — the current build runs fully with email/password auth.
