# AI Travel Planner — Mobile (Expo)

Premium **Expo** app (SDK 54 · React Native 0.81 · new architecture) — runs in
**Expo Go** (scan a QR, no Android SDK / Xcode needed). Glassmorphic UI: dreamy
sky-blue gradients, frosted cards, Outfit + Inter type, floating glass tab bar.

## Stack

| Concern | Library |
|---|---|
| Runtime | Expo SDK 54 (Expo Go compatible) |
| Navigation | `@react-navigation/native` · native-stack · bottom-tabs |
| Auth | Firebase JS SDK (`firebase/auth`) + AsyncStorage persistence |
| Data | `axios` + `@tanstack/react-query` (Bearer Firebase ID token) |
| Animation | `react-native-reanimated` v4, RN `Animated` |
| Visuals | `expo-linear-gradient`, `react-native-svg`, `lucide-react-native`, `lottie-react-native` |
| Media | `expo-image-picker` · `expo-font` |

## Features (mapped to the backend)

AI trip planner (generate → results → rich itinerary/budget detail · save) ·
AI chat assistant · Community feed (posts, likes, comments, create w/ photos,
groups) · Experiences feed (create, like, save) · People search + follow ·
Friends · Notifications · Direct messaging · Expenses · Safety · Trains ·
Profile. All against the live backend `/api/v1`.

## Run in Expo Go

```bash
npm install
npx expo start          # press "s" for Expo Go, then scan the QR
```

Install the **Expo Go** app on your phone (Play Store / App Store), scan the QR
from `npx expo start`. That's it — no native toolchain required.

## Configure

Backend URL + Firebase web config live in [`src/lib/env.ts`](src/lib/env.ts).
For a physical device, the deployed backend URL works out of the box.

## Build an APK / AAB (EAS — cloud, no local Android SDK)

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview   # → downloadable APK
```

No local JDK/Android SDK needed — EAS builds in the cloud. (A `preview` profile
produces an installable APK; `production` produces an AAB for the Play Store.)

## Structure

```
src/
  theme/         colors · typography · spacing/radius/shadow
  components/    ui kit (AppText, Button, Input, Card, Chip, Gradient, Glass…) + PlanCard, PostCard, ExperienceCard
  lib/           env · firebase · api · queryClient · imagePicker · upload
  services/      plans · ai · community · experiences · social · messaging (+ more)
  context/       AuthContext (Firebase <-> backend profile)
  navigation/    Root · Auth · Main (stack) · Tab · GlassTabBar
  screens/       auth · home · explore · community · planner · ai · social · messaging · trips · profile
  assets/        fonts (Outfit, Inter) · lottie
```
