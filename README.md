# AI Travel Planner

A full-stack, AI-powered travel planning platform — plan smarter, wander further.
This monorepo contains three apps that share one backend contract.

```
AI_Travel/
├── Backend/                  # Express + TypeScript API (MongoDB, Redis, Socket.IO, Firebase Auth)
├── frontend/                 # React + Vite web app (Tailwind, Firebase, admin dashboard)
└── AI_Travel_Planner_Mobile/ # React Native (CLI) mobile app — glassmorphic UI
```

---

## 📦 Backend  (`/Backend`)

Express + TypeScript API with ~20 feature modules: AI planning, hotels, trains,
bookings, community, expenses (smart split), trust score + fraud detection,
safety, social, messaging, reviews, newsletter, and an admin suite.

**Stack:** Express · TypeScript · MongoDB (Mongoose) · Redis (ioredis) · Socket.IO ·
Firebase Admin (auth) · Google Gemini / Groq (AI) · Cloudinary · Nodemailer · Swagger.

```bash
cd Backend
npm install
cp .env.sample .env      # fill in your secrets (see below)
npm run dev              # nodemon + ts-node
npm run build && npm run serve   # production
```

Auth model: the client authenticates with **Firebase** and sends the ID token as
`Authorization: Bearer <token>`. The backend verifies it (`verifyFirebaseToken` /
`protect` middleware) and auto-provisions the user. API is namespaced under `/api/v1`.
Interactive docs at `/api-docs` (Swagger).

> ⚠️ Never commit real secrets. `.env` and any `*firebase-adminsdk*.json`
> service-account keys are gitignored.

---

## 🌐 Frontend  (`/frontend`)

React 19 + Vite web client with a rich customer experience and a full admin
dashboard (metrics, moderation, audit logs, realtime via Socket.IO).

**Stack:** React · Vite · Tailwind CSS 4 · Radix UI · Firebase · Framer Motion · MUI.

```bash
cd frontend
npm install
# .env → VITE_BACKEND_URL=<backend url>
npm run dev
```

---

## 📱 Mobile  (`/AI_Travel_Planner_Mobile`)

**Expo** app (SDK 54, RN 0.81, new architecture) that runs in **Expo Go** —
scan a QR, no Android SDK / Xcode needed. Premium glassmorphic UI (soft sky
gradients, frosted cards, Outfit + Inter). Full backend feature parity: AI
planner, AI chat, community, experiences, social, messaging, expenses, safety,
trains, profile. See its own [README](AI_Travel_Planner_Mobile/README.md).

**Stack:** Expo · React Navigation · Reanimated · Firebase (JS SDK) · react-query ·
expo-linear-gradient · expo-image-picker · Lottie · lucide icons · Axios.

```bash
cd AI_Travel_Planner_Mobile
npm install
# set the backend URL in src/lib/env.ts
npx expo start     # press "s" for Expo Go, scan the QR
```

---

## 🔐 Environment & secrets

- Backend: copy `Backend/.env.sample` → `Backend/.env`.
- Mobile: backend URL + Firebase web config live in `src/lib/env.ts`.
- The Firebase **web** config is public and safe to ship. The Firebase
  **admin service-account** JSON is a private key — keep it out of git.
