# TacTic Board – Fancy Tic-Tac-Toe (Ionic + Vue)

Modern, good-looking single-player Tic-Tac-Toe app built with **Ionic Vue**, featuring:

- Animated glassmorphic UI
- Player name & custom board background customization
- Shake device to reset board
- Haptic feedback (taps, win, draw)
- Save finished games with geolocation + weather snapshot
- Match history with statistics, mini-board preview, location & weather display
- Clean settings screen with live preview

## Features

- 3×3 Tic-Tac-Toe with win/draw detection
- Turn indicators & animated status banner
- Local persistent settings & game history (localStorage)
- Geolocation + Open-Meteo weather on game save
- Shake gesture support (Capacitor Motion)
- Vibration feedback (Capacitor Haptics)
- Responsive layout (mobile + tablet)

## Tech Stack

- Ionic 7+ / Vue 3 (Composition API)
- Capacitor (Geolocation, Haptics, Motion)
- localStorage persistence
- Open-Meteo API (free, no key needed)
- Fonts: Rajdhani, Share Tech Mono (Google Fonts)

## Prerequisites

- Node.js ≥ 18
- npm or pnpm / yarn
- Ionic CLI: `npm install -g @ionic/cli`

## Installation & Run

```bash
# 1. Clone or unzip the project
# 2. Install dependencies
npm install
# or
pnpm install
# or
yarn install

# 3. Run in browser (development server)
ionic serve
# → opens http://localhost:8100

# 4. (Optional) Run on Android device/emulator
ionic capacitor add android
ionic capacitor run android

# 5. (Optional) Run on iOS (macOS only)
ionic capacitor add ios
ionic capacitor run ios

# 6. Build production web assets
ionic build --prod
```

## Capacitor Sync (after adding plugins or changing web code)


```bash
ionic capacitor sync
```

## Important Notes

- Shake-to-reset and haptics work best on real devices (not all emulators support motion/haptics).
- Geolocation requires location permission → prompted on first save attempt.
- Weather is fetched from Open-Meteo → no API key needed.
- All data (settings + history) is stored in browser/device localStorage.
