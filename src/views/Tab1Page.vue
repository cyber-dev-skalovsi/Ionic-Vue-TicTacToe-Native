<template>
  <ion-page class="chess-page">
    <ion-header class="glass-header">
      <ion-toolbar class="glow-toolbar">
        <ion-title class="glow-title">{{ settings.gameName || 'TacTic Board' }}</ion-title>
        </ion-toolbar>
    </ion-header>

    <ion-content class="dark-content ion-padding">

      <div class="players-row">
        <div class="player-pill" :class="{ 'pill-active': nextPlayer === 'X' && !gameOver, 'pill-x': true }">
          <span class="pill-symbol">X</span>
          <span class="pill-name">{{ settings.playerXName }}</span>
          <span class="pip" v-if="nextPlayer === 'X' && !gameOver"></span>
        </div>

        <div class="vs-badge">VS</div>

        <div class="player-pill" :class="{ 'pill-active': nextPlayer === 'O' && !gameOver, 'pill-o': true }">
          <span class="pill-symbol">O</span>
          <span class="pill-name">{{ settings.playerOName }}</span>
          <span class="pip" v-if="nextPlayer === 'O' && !gameOver"></span>
        </div>
      </div>

      <div class="status-banner" :class="{ 'winner-glow': winner, 'draw-glow': isDraw }">
        <span v-if="winner" class="winner-text">
          <ion-icon :icon="trophyOutline" class="trophy-icon" />
          {{ winner === 'X' ? settings.playerXName : settings.playerOName }} wins!
        </span>
        <span v-else-if="isDraw" class="draw-text">Draw — Well played!</span>
        <span v-else class="turn-text">
          <span class="player-dot" :class="nextPlayer === 'X' ? 'dot-blue' : 'dot-pink'"></span>
          {{ nextPlayer === 'X' ? settings.playerXName : settings.playerOName }}'s turn
        </span>
      </div>

      <div class="board-wrapper">
        <div class="board-glow-ring"></div>
        <div
          class="board"
          :style="{ background: settings.boardBg }"
        >
          <div
            v-for="(cell, i) in board"
            :key="i"
            class="cell"
            :class="[
              cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : 'cell-empty',
              winCells.includes(i) ? 'cell-win' : ''
            ]"
            @click="makeMove(i)"
          >
            <span v-if="cell" class="cell-symbol pop-in">{{ cell }}</span>
            <div v-if="!cell" class="cell-hover-fx"></div>
          </div>
        </div>
      </div>

      <div class="action-row">
        <ion-button expand="block" class="reset-btn" @click="resetGame">
          <ion-icon :icon="refreshOutline" slot="start" />
          New Game
        </ion-button>
        <ion-button
          expand="block"
          class="save-btn"
          :disabled="!gameOver || savingToHistory"
          @click="promptSaveAndReset"
        >
          <ion-icon :icon="bookmarkOutline" slot="start" />
          Save
        </ion-button>
      </div>

      <transition name="fade-pop">
        <div v-if="savingToHistory" class="saving-banner">
          <ion-spinner name="crescent" />
          <span>Saving match &amp; fetching location…</span>
        </div>
      </transition>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonSpinner,
  alertController, toastController,
} from '@ionic/vue';
import { trophyOutline, refreshOutline, bookmarkOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';
import { loadSettings } from './settings';

// ── Settings ──────────────────────────────────────────────────────────────────
const settings = ref(loadSettings());

onMounted(() => { settings.value = loadSettings(); });

// ── Constants ─────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'tactic_history';

const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Clear sky',              emoji: '☀️' },
  1:  { label: 'Mainly clear',           emoji: '🌤️' },
  2:  { label: 'Partly cloudy',          emoji: '⛅' },
  3:  { label: 'Overcast',               emoji: '☁️' },
  45: { label: 'Foggy',                  emoji: '🌫️' },
  48: { label: 'Icy fog',                emoji: '🌫️' },
  51: { label: 'Light drizzle',          emoji: '🌦️' },
  53: { label: 'Drizzle',                emoji: '🌦️' },
  55: { label: 'Heavy drizzle',          emoji: '🌧️' },
  61: { label: 'Light rain',             emoji: '🌧️' },
  63: { label: 'Rain',                   emoji: '🌧️' },
  65: { label: 'Heavy rain',             emoji: '🌧️' },
  71: { label: 'Light snow',             emoji: '🌨️' },
  73: { label: 'Snow',                   emoji: '❄️' },
  75: { label: 'Heavy snow',             emoji: '❄️' },
  80: { label: 'Rain showers',           emoji: '🌦️' },
  81: { label: 'Showers',                emoji: '🌦️' },
  82: { label: 'Violent showers',        emoji: '⛈️' },
  95: { label: 'Thunderstorm',           emoji: '⛈️' },
  96: { label: 'Thunderstorm + hail',    emoji: '⛈️' },
  99: { label: 'Thunderstorm + hail',    emoji: '⛈️' },
};

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

// ── Game State ────────────────────────────────────────────────────────────────
const board        = ref<(string | null)[]>(Array(9).fill(null));
const nextPlayer   = ref<'X' | 'O'>('X');
const gameOver     = ref(false);
const savingToHistory = ref(false);
const gameStartTime   = ref(Date.now());

const winCells = computed<number[]>(() => {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board.value[a] && board.value[a] === board.value[b] && board.value[a] === board.value[c])
      return line;
  }
  return [];
});

const winner  = computed(() => winCells.value.length ? board.value[winCells.value[0]] : null);
const isDraw  = computed(() => !winner.value && board.value.every(c => c !== null));

// ── Move ──────────────────────────────────────────────────────────────────────
const makeMove = async (index: number) => {
  if (board.value[index] || gameOver.value) return;

  const cur = nextPlayer.value;
  const next = [...board.value];
  next[index] = cur;
  board.value = next;

  const won = WIN_LINES.some(([a, b, c]) =>
    next[a] === cur && next[b] === cur && next[c] === cur
  );

  if (won) {
    gameOver.value = true;
    await Haptics.impact({ style: ImpactStyle.Heavy });
    return;
  }

  if (next.every(c => c !== null)) {
    gameOver.value = true;
    await Haptics.impact({ style: ImpactStyle.Light });
    return;
  }

  nextPlayer.value = cur === 'X' ? 'O' : 'X';
  await Haptics.impact({ style: ImpactStyle.Light });
};

// ── Reset ─────────────────────────────────────────────────────────────────────
const resetGame = async () => {
  board.value = Array(9).fill(null);
  nextPlayer.value = 'X';
  gameOver.value = false;
  gameStartTime.value = Date.now();
  await Haptics.notification({ type: 'SUCCESS' as any });
};

// ── Save prompt ───────────────────────────────────────────────────────────────
const promptSaveAndReset = async () => {
  const currentSettings = loadSettings();
  const defaultName = currentSettings.gameName || 'My Match';

  const alert = await alertController.create({
    header: 'Save Match',
    message: 'Give this match a name before saving.',
    cssClass: 'dark-alert',
    inputs: [
      { name: 'matchName', type: 'text', placeholder: defaultName, value: defaultName },
    ],
    buttons: [
      { text: 'Discard', role: 'cancel', cssClass: 'alert-btn-cancel', handler: () => resetGame() },
      {
        text: 'Save & Continue',
        cssClass: 'alert-btn-confirm',
        handler: async (data) => {
          const name = (data.matchName as string)?.trim() || defaultName;
          await saveGame(name);
          resetGame();
        },
      },
    ],
  });
  await alert.present();
};

// ── Persist game + geo + weather ──────────────────────────────────────────────
const saveGame = async (matchName: string) => {
  savingToHistory.value = true;

  const durationSec = Math.round((Date.now() - gameStartTime.value) / 1000);
  const boardSnapshot = [...board.value];

  const entry: any = {
    id: Date.now(),
    matchName,
    winner: winner.value,
    isDraw: isDraw.value,
    board: boardSnapshot,
    durationSec,
    timestamp: new Date().toISOString(),
    lat: null,
    lng: null,
    cityName: null,
    weatherText: null,
    weatherEmoji: null,
    weatherTemp: null,
    isDayTime: null,
    locationError: null,
  };

  try {
    const pos = await Geolocation.getCurrentPosition({ timeout: 10_000 });
    entry.lat = pos.coords.latitude;
    entry.lng = pos.coords.longitude;

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${entry.lat}&lon=${entry.lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      entry.cityName =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        geoData.address?.county ||
        null;
    }

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${entry.lat}&longitude=${entry.lng}` +
      `&current=temperature_2m,weather_code,is_day` +
      `&temperature_unit=celsius&forecast_days=1`
    );
    if (wxRes.ok) {
      const wxData = await wxRes.json();
      const cur = wxData.current;
      const mapped = WMO_CODES[cur.weather_code as number] ?? { label: `Code ${cur.weather_code}`, emoji: '🌡️' };
      entry.weatherText  = mapped.label;
      entry.weatherEmoji = mapped.emoji;
      entry.weatherTemp  = Math.round(cur.temperature_2m);
      entry.isDayTime    = cur.is_day === 1;
    }
  } catch {
    entry.locationError = 'Location unavailable';
  }

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: any[] = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* storage unavailable */ }

  savingToHistory.value = false;

  const toast = await toastController.create({
    message: entry.cityName
      ? `✅ Saved · ${entry.cityName} · ${entry.weatherEmoji ?? ''} ${entry.weatherTemp ?? ''}°C`
      : '✅ Match saved to history',
    duration: 3000,
    position: 'top',
    cssClass: 'dark-toast',
  });
  toast.present();
};
</script>

<style scoped>
/* (Styles are unchanged from previous version) */
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap');

.chess-page {
  --bg-deep:     #060c18;
  --bg-card:     #0d1a2e;
  --blue-glow:   #1a9fff;
  --pink-accent: #f060b0;
  --gold:        #f0c060;
  --text-main:   #c8dff8;
  --text-dim:    #5a7a9a;
}

.glass-header ion-toolbar.glow-toolbar {
  --background: rgba(6, 12, 24, 0.95);
  --border-color: transparent;
  border-bottom: 1px solid rgba(26, 159, 255, 0.18);
  box-shadow: 0 2px 24px rgba(26, 159, 255, 0.2);
}

.glow-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--blue-glow);
  text-shadow: 0 0 14px rgba(26, 159, 255, 0.85);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.dark-content {
  --background: var(--bg-deep);
  --color: var(--text-main);
}

.players-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.player-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 18px;
  border-radius: 16px;
  background: rgba(13, 26, 46, 0.8);
  border: 1px solid rgba(26, 159, 255, 0.1);
  transition: all 0.25s ease;
  position: relative;
  min-width: 80px;
}

.pill-active {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(26, 159, 255, 0.15);
}

.pill-x.pill-active { border-color: var(--blue-glow); }
.pill-o.pill-active { border-color: var(--pink-accent); }

.pill-symbol {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.pill-x .pill-symbol { color: var(--blue-glow); text-shadow: 0 0 10px rgba(26,159,255,0.7); }
.pill-o .pill-symbol { color: var(--pink-accent); text-shadow: 0 0 10px rgba(240,96,176,0.7); }

.pill-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-dim);
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pip {
  position: absolute;
  top: -4px; right: -4px;
  width: 9px; height: 9px;
  border-radius: 50%;
  background: var(--ion-color-success, #2dd36f);
  border: 1.5px solid var(--bg-deep);
  animation: pipPulse 1.2s ease infinite;
}

@keyframes pipPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.5); opacity: 0.6; }
}

.vs-badge {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-dim);
  padding: 4px 8px;
  border: 1px solid rgba(90, 122, 154, 0.2);
  border-radius: 8px;
}

.status-banner {
  text-align: center;
  padding: 12px 20px;
  margin: 0 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(26, 159, 255, 0.15);
  background: rgba(13, 26, 46, 0.8);
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 1px;
  transition: border-color 0.4s ease;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.winner-glow { border-color: var(--gold) !important; animation: pulseGold 1.5s infinite alternate; }
.draw-glow   { border-color: var(--text-dim) !important; }

@keyframes pulseGold {
  from { box-shadow: 0 0 16px rgba(240, 192, 96, 0.2); }
  to   { box-shadow: 0 0 40px rgba(240, 192, 96, 0.55); }
}

.winner-text {
  color: var(--gold);
  text-shadow: 0 0 10px rgba(240, 192, 96, 0.7);
  display: flex; align-items: center; gap: 8px;
}
.draw-text { color: var(--text-dim); }
.turn-text { color: var(--text-main); display: flex; align-items: center; justify-content: center; gap: 8px; }

.player-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-blue { background: var(--blue-glow); box-shadow: 0 0 8px var(--blue-glow); }
.dot-pink { background: var(--pink-accent); box-shadow: 0 0 8px var(--pink-accent); }
.trophy-icon { font-size: 1.1rem; }

.board-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 0 auto 16px;
  max-width: 380px;
}

@media (min-width: 768px) {
  .board-wrapper { max-width: 480px; }
  .players-row   { gap: 20px; }
  .player-pill   { min-width: 110px; padding: 14px 24px; }
  .pill-symbol   { font-size: 2rem; }
}

.board-glow-ring {
  position: absolute;
  inset: -16px;
  border-radius: 28px;
  background: radial-gradient(ellipse at center, rgba(26, 159, 255, 0.08) 0%, transparent 70%);
  pointer-events: none;
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; transform: scale(1.03); }
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: rgba(13, 26, 46, 0.75);
  border: 1px solid rgba(26, 159, 255, 0.18);
  border-radius: 18px;
  backdrop-filter: blur(12px);
  transition: background 0.4s ease;
}

.cell {
  aspect-ratio: 1;
  background: rgba(6, 18, 38, 0.85);
  border: 1px solid rgba(26, 159, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.2s ease;
}

.cell:active              { transform: scale(0.91); }
.cell-empty:hover         { border-color: rgba(26, 159, 255, 0.42); }
.cell-empty:hover .cell-hover-fx { opacity: 1; }

.cell-hover-fx {
  position: absolute; inset: 0;
  background: radial-gradient(circle, rgba(26, 159, 255, 0.09) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.cell-symbol {
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(1.6rem, 7vw, 2.6rem);
  font-weight: 700;
  line-height: 1;
  z-index: 2;
}

.cell-x { border-color: rgba(26, 159, 255, 0.28); background: rgba(26, 159, 255, 0.04); }
.cell-x .cell-symbol { color: var(--blue-glow); text-shadow: 0 0 18px rgba(26,159,255,0.95); }

.cell-o { border-color: rgba(240, 96, 176, 0.28); background: rgba(240, 96, 176, 0.04); }
.cell-o .cell-symbol { color: var(--pink-accent); text-shadow: 0 0 18px rgba(240,96,176,0.95); }

.cell-win {
  border-color: var(--gold) !important;
  animation: winPulse 0.9s ease-in-out infinite alternate;
}
@keyframes winPulse {
  from { box-shadow: inset 0 0 8px rgba(240,192,96,0.1); }
  to   { box-shadow: inset 0 0 28px rgba(240,192,96,0.5), 0 0 18px rgba(240,192,96,0.3); }
}

@keyframes popIn {
  0%   { transform: scale(0.4) rotate(-10deg); opacity: 0; }
  70%  { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.pop-in { animation: popIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

.action-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.reset-btn {
  flex: 1;
  --background: linear-gradient(135deg, #0a3a80 0%, #1a9fff 100%);
  --border-radius: 12px;
  --box-shadow: 0 4px 24px rgba(26, 159, 255, 0.3);
  --color: #fff;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.save-btn {
  flex: 1;
  --background: linear-gradient(135deg, #6b1a60 0%, #f060b0 100%);
  --border-radius: 12px;
  --box-shadow: 0 4px 24px rgba(240, 96, 176, 0.3);
  --color: #fff;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.saving-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.88rem;
  color: var(--blue-glow);
  letter-spacing: 1px;
  padding: 10px;
  background: rgba(26, 159, 255, 0.05);
  border: 1px solid rgba(26, 159, 255, 0.14);
  border-radius: 10px;
}

.fade-pop-enter-active { animation: fadePop 0.3s ease; }
.fade-pop-leave-active { animation: fadePop 0.2s reverse ease; }
@keyframes fadePop {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>

<style>
.dark-alert { --background: #0d1a2e; --color: #c8dff8; }
.dark-alert .alert-title    { font-family: 'Rajdhani', sans-serif !important; color: #1a9fff !important; letter-spacing: 2px; }
.dark-alert .alert-message  { font-family: 'Rajdhani', sans-serif !important; color: #5a7a9a !important; }
.dark-alert .alert-input    { background: rgba(6,18,38,0.9) !important; color: #c8dff8 !important; border-color: rgba(26,159,255,0.3) !important; font-family: 'Rajdhani', sans-serif !important; }
.dark-alert .alert-btn-cancel  { color: #5a7a9a !important; font-family: 'Rajdhani', sans-serif !important; }
.dark-alert .alert-btn-confirm { color: #1a9fff !important; font-family: 'Rajdhani', sans-serif !important; font-weight: 700 !important; }
.dark-toast { --background: #0d1a2e; --color: #c8dff8; font-family: 'Rajdhani', sans-serif; letter-spacing: 0.5px; border: 1px solid rgba(26,159,255,0.25); border-radius: 12px; }
</style>