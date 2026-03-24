<template>
  <ion-page class="history-page">
    <ion-header class="glass-header">
      <ion-toolbar class="glow-toolbar">
        <ion-title class="glow-title">Match History</ion-title>
        <ion-buttons slot="end">
          <ion-button class="clear-btn" @click="confirmClear" v-if="history.length">
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dark-content">

      <!-- ═══════════════════════════════════════════════════════
           AUFGABE 2 – Koordinaten auf der UI anzeigen
           ───────────────────────────────────────────────────────
           Verdrahte den Button mit printLocation() und zeige
           lat/lng reaktiv an. Nutze v-if / v-else.

           Vorlage (fülle die ??? aus):
           ───────────────────────────────────────────────────────
           <ion-button @click="???">📡 Standort abrufen</ion-button>
           <p v-if="???">🌍 {{ ???.toFixed(4) }}°, {{ ????.toFixed(4) }}°</p>
           <p v-else>⏳ Noch kein Standort …</p>

           ═══════════════════════════════════════════════════════
           AUFGABE 3 – Error Handling (Ergänzung hier im Template)
           ───────────────────────────────────────────────────────
           Zeige locationError an wenn GPS fehlschlägt.
           ZUSATZ: Zeige auch accuracy in Metern an.

           Vorlage:
           ───────────────────────────────────────────────────────
           <p v-if="???">⚠️ {{ ??? }}</p>
           <p v-if="???">🎯 Genauigkeit: {{ ???.toFixed(1) }} m</p>

          -->


      <!-- Empty State -->
      <div v-if="history.length === 0" class="empty-state">
        <div class="empty-icon">🎮</div>
        <div class="empty-title">No games yet</div>
        <div class="empty-sub">Finish a game and save it to record it here</div>
      </div>

      <!-- Stats Strip -->
      <div v-if="history.length > 0" class="stats-strip">
        <div class="stat-pill">
          <span class="stat-val">{{ history.length }}</span>
          <span class="stat-lbl">Total</span>
        </div>
        <div class="stat-pill stat-x">
          <span class="stat-val">{{ xWins }}</span>
          <span class="stat-lbl">X Wins</span>
        </div>
        <div class="stat-pill stat-o">
          <span class="stat-val">{{ oWins }}</span>
          <span class="stat-lbl">O Wins</span>
        </div>
        <div class="stat-pill stat-draw">
          <span class="stat-val">{{ draws }}</span>
          <span class="stat-lbl">Draws</span>
        </div>
      </div>

      <!-- History List -->
      <div v-if="history.length > 0" class="history-list">
        <transition-group name="slide-in" tag="div" class="list-inner">
          <ion-item-sliding v-for="(entry, idx) in history" :key="entry.id">
            <ion-item class="slide-item" lines="none">
              <div class="history-card" :class="entry.isDraw ? 'card-draw' : entry.winner === 'X' ? 'card-x' : 'card-o'">
                <div class="card-accent-line"></div>
                <div class="entry-index">#{{ history.length - idx }}</div>
                <div class="card-top">
                  <div class="winner-badge" :class="entry.isDraw ? 'badge-draw' : entry.winner === 'X' ? 'badge-x' : 'badge-o'">
                    <span v-if="entry.isDraw">🤝</span>
                    <template v-else>
                      <ion-icon :icon="trophyOutline" class="badge-trophy" />
                      <span>{{ entry.winner }}</span>
                    </template>
                  </div>
                  <div class="card-info">
                    <div class="match-name">{{ entry.matchName || 'Unnamed Match' }}</div>
                    <div class="result-line">
                      <span v-if="entry.isDraw">Draw</span>
                      <span v-else>Player <strong>{{ entry.winner }}</strong> wins</span>
                      <span class="sep">·</span>
                      {{ formatDuration(entry.durationSec) }}
                    </div>
                    <div class="entry-time">
                      <ion-icon :icon="timeOutline" class="meta-icon" />
                      <span>{{ formatDate(entry.timestamp) }}</span>
                    </div>
                  </div>
                  <div class="mini-board">
                    <div
                      v-for="(cell, ci) in entry.board" :key="ci"
                      class="mini-cell"
                      :class="cell === 'X' ? 'mini-x' : cell === 'O' ? 'mini-o' : ''"
                    >{{ cell || '' }}</div>
                  </div>
                </div>
                <div v-if="entry.lat && entry.lng" class="entry-location">
                  <ion-icon :icon="navigateOutline" class="meta-icon meta-icon--blue" />
                  <span v-if="entry.cityName" class="city-name">{{ entry.cityName }}</span>
                  <span class="mono coords">{{ entry.lat.toFixed(3) }}°, {{ entry.lng.toFixed(3) }}°</span>
                </div>
                <div v-else-if="entry.locationError" class="entry-no-location">
                  <ion-icon :icon="locationOutline" class="meta-icon meta-icon--dim" />
                  <span>{{ entry.locationError }}</span>
                </div>
                <div v-if="entry.weatherText" class="entry-weather">
                  <span class="weather-emoji">{{ entry.weatherEmoji }}</span>
                  <span class="weather-label">{{ entry.weatherText }}</span>
                  <span class="weather-temp">{{ entry.weatherTemp }}°C</span>
                </div>
              </div>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" @click="deleteEntry(entry.id)">
                <ion-icon slot="top" :icon="trashOutline" />
                Delete
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </transition-group>
      </div>

      <div style="height: 32px"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
  alertController,
} from '@ionic/vue';
import {
  trophyOutline, timeOutline, navigateOutline, locationOutline, trashOutline,
} from 'ionicons/icons';

// ═══════════════════════════════════════════════════════════════════════════════
// AUFGABE 1 – Composable importieren & einbinden
// ───────────────────────────────────────────────────────────────────────────────
// 1. Importiere useGeolocation aus '@/composables/useGeolocation'
// 2. Rufe useGeolocation() auf und destructure: lat, lng, locationError,
//    accuracy und printLocation daraus
//
// Vorlage (fülle die ??? aus):
//
//   import { ??? } from '@/composables/useGeolocation';
//   const { ???, ???, ???, ???, ??? } = useGeolocation();
//

// ═══════════════════════════════════════════════════════════════════════════════
// AUFGABE 1 – useGeolocation.ts  (Datei: composables/useGeolocation.ts)
// ───────────────────────────────────────────────────────────────────────────────
// Erstelle die Datei mit folgendem Grundgerüst und fülle die TODOs aus:
//
//   import { ref } from 'vue';
//
//   export function useGeolocation() {
//
//     // TODO: zwei reaktive refs, Typ number | null, Startwert null
//     const lat = ???
//     const lng = ???
//
//     // TODO: async-Funktion printLocation()
//     //   → navigator.geolocation.getCurrentPosition() aufrufen
//     //   → lat.value / lng.value zuweisen
//     //   → console.log() mit den Koordinaten ausgeben 🗺️
//     async function printLocation() {
//       // dein Code hier …
//     }
//
//     return { lat, lng, printLocation };
//   }
//

// ═══════════════════════════════════════════════════════════════════════════════
// AUFGABE 2 – Koordinaten auf der UI anzeigen
// ───────────────────────────────────────────────────────────────────────────────
// Der Template-Block oben ist bereits vorbereitet (geo-block).
// Stelle sicher dass lat, lng, printLocation korrekt aus dem Composable
// kommen (Aufgabe 1) – dann funktioniert das Binding automatisch. ✅
//
// Was das Template macht:
//   @click="printLocation"  → Button ruft die Funktion auf
//   v-if="lat"              → Koordinaten nur anzeigen wenn nicht null
//   v-else                  → Fallback-Text solange noch kein Standort
// ───────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// AUFGABE 3 – Error Handling & Mini-Challenge
// ───────────────────────────────────────────────────────────────────────────────
// PFLICHT:
//   Der error-Callback in navigator.geolocation.getCurrentPosition() übernimmt
//   die Rolle von try/catch. locationError wird im Template mit v-if angezeigt.
//   → Teste: GPS im Browser blockieren → Konsole + UI zeigen die Fehlermeldung ✅
//
// ZUSATZ:
//   accuracy wird als ref exportiert und im Template als "🎯 Genauigkeit: X m"
//   angezeigt. ✅
//   Idee für Weiterdenker: Kannst du accuracy auch im HistoryEntry speichern?
// ───────────────────────────────────────────────────────────────────────────────

// ── History ──────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'tactic_history';

interface HistoryEntry {
  id: number;
  matchName: string;
  winner: string | null;
  isDraw: boolean;
  board: (string | null)[];
  durationSec: number;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  cityName: string | null;
  weatherText: string | null;
  weatherEmoji: string | null;
  weatherTemp: number | null;
  isDayTime: boolean | null;
  locationError: string | null;
}

const history = ref<HistoryEntry[]>([]);

const xWins = computed(() => history.value.filter(e => !e.isDraw && e.winner === 'X').length);
const oWins = computed(() => history.value.filter(e => !e.isDraw && e.winner === 'O').length);
const draws = computed(() => history.value.filter(e => e.isDraw).length);

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    history.value = raw ? JSON.parse(raw) : [];
  } catch {
    history.value = [];
  }
};

onMounted(loadHistory);
onActivated(loadHistory);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDuration = (sec: number) => {
  if (!sec || sec < 0) return '—';
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
};

const deleteEntry = (id: number) => {
  history.value = history.value.filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value));
};

const confirmClear = async () => {
  const alert = await alertController.create({
    header: 'Clear History',
    message: 'Delete all match records?',
    cssClass: 'dark-alert',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Clear All',
        role: 'destructive',
        cssClass: 'alert-btn-danger',
        handler: () => {
          localStorage.removeItem(HISTORY_KEY);
          history.value = [];
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
:root {
  --blue-glow:   #1a9fff;
  --pink-accent: #f060b0;
  --gold:        #f0c060;
  --bg-deep:     #060c18;
  --text-main:   #c8dff8;
  --text-dim:    #5a7a9a;
}

.glass-header { --background: rgba(6, 12, 24, 0.85); backdrop-filter: blur(12px); }
.glow-toolbar { --background: transparent; --border-color: rgba(26, 159, 255, 0.15); }
.glow-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.3rem;
  color: var(--blue-glow);
  text-shadow: 0 0 14px rgba(26, 159, 255, 0.8);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.clear-btn    { --color: #f06060; --background: transparent; font-size: 1.1rem; }
.dark-content { --background: var(--bg-deep); --color: var(--text-main); }

/* ── Geolocation Block ── */
.geo-block {
  padding: 14px 16px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.geo-btn {
  --background: rgba(26, 159, 255, 0.1);
  --background-activated: rgba(26, 159, 255, 0.2);
  --color: var(--blue-glow);
  --border-radius: 12px;
  border: 1px solid rgba(26, 159, 255, 0.25);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.geo-result      { display: flex; flex-direction: column; gap: 2px; padding: 0 4px; }
.geo-coords      { font-family: 'Share Tech Mono', monospace; font-size: 0.9rem; color: var(--blue-glow); margin: 0; }
.geo-placeholder { font-family: 'Rajdhani', sans-serif; font-size: 0.82rem; color: var(--text-dim); margin: 0; }
.geo-error       { font-family: 'Rajdhani', sans-serif; font-size: 0.82rem; color: #f06060; margin: 0; }
.geo-accuracy    { font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; color: var(--text-dim); margin: 0; }

/* ── Empty State ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 60vh; gap: 10px; padding: 20px;
}
.empty-icon  { font-size: 3.5rem; filter: grayscale(0.5) opacity(0.5); animation: float 3s ease-in-out infinite; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
.empty-title { font-family: 'Rajdhani', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }
.empty-sub   { font-family: 'Rajdhani', sans-serif; font-size: 0.82rem; color: rgba(90, 122, 154, 0.6); letter-spacing: 1px; text-align: center; }

/* ── Stats strip ── */
.stats-strip { display: flex; gap: 8px; padding: 14px 16px 2px; }
.stat-pill {
  flex: 1; background: rgba(13, 26, 46, 0.8); border: 1px solid rgba(26, 159, 255, 0.1);
  border-radius: 14px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; gap: 2px;
}
.stat-x    { border-color: rgba(26, 159, 255, 0.3);   background: rgba(26, 159, 255, 0.06); }
.stat-o    { border-color: rgba(240, 96, 176, 0.3);   background: rgba(240, 96, 176, 0.06); }
.stat-draw { border-color: rgba(240, 192, 96, 0.3);   background: rgba(240, 192, 96, 0.06); }
.stat-val  { font-family: 'Share Tech Mono', monospace; font-size: 1.3rem; font-weight: 700; color: var(--text-main); line-height: 1; }
.stat-lbl  { font-family: 'Rajdhani', sans-serif; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-dim); }

/* ── History List ── */
.history-list { padding: 12px 12px 0; }
.list-inner   { display: flex; flex-direction: column; gap: 10px; }

ion-item-sliding { border-radius: 16px; overflow: hidden; }
.slide-item {
  --background: transparent; --padding-start: 0;
  --inner-padding-end: 0; --border-style: none;
}

/* ── History Card ── */
.history-card {
  width: 100%; background: rgba(13, 26, 46, 0.88); border-radius: 16px;
  padding: 12px 14px; border: 1px solid; position: relative;
  overflow: hidden; backdrop-filter: blur(10px); display: flex; flex-direction: column; gap: 8px;
}
.card-x    { border-color: rgba(26, 159, 255, 0.22);  box-shadow: 0 2px 20px rgba(26, 159, 255, 0.07); }
.card-o    { border-color: rgba(240, 96, 176, 0.22);  box-shadow: 0 2px 20px rgba(240, 96, 176, 0.07); }
.card-draw { border-color: rgba(240, 192, 96, 0.22);  box-shadow: 0 2px 20px rgba(240, 192, 96, 0.07); }

.card-accent-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
.card-x    .card-accent-line { background: linear-gradient(90deg, transparent, var(--blue-glow), transparent); }
.card-o    .card-accent-line { background: linear-gradient(90deg, transparent, var(--pink-accent), transparent); }
.card-draw .card-accent-line { background: linear-gradient(90deg, transparent, var(--gold), transparent); }

.entry-index {
  position: absolute; top: 10px; right: 12px;
  font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; color: var(--text-dim); letter-spacing: 1px;
}

.card-top     { display: flex; align-items: flex-start; gap: 10px; }

.winner-badge {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 20px;
  font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 1rem;
  letter-spacing: 2px; text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
}
.badge-x    { background: rgba(26, 159, 255, 0.12); color: var(--blue-glow);   border: 1px solid rgba(26, 159, 255, 0.3);  text-shadow: 0 0 10px rgba(26,159,255,0.6); }
.badge-o    { background: rgba(240, 96, 176, 0.12); color: var(--pink-accent); border: 1px solid rgba(240, 96, 176, 0.3); text-shadow: 0 0 10px rgba(240,96,176,0.6); }
.badge-draw { background: rgba(240, 192, 96, 0.12); color: var(--gold);        border: 1px solid rgba(240, 192, 96, 0.3); font-size: 1.2rem; padding: 4px 10px; }
.badge-trophy { font-size: 0.9rem; }

.card-info  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.match-name {
  font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 0.95rem;
  color: var(--text-main); letter-spacing: 0.5px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.result-line { font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; color: var(--text-dim); display: flex; align-items: center; gap: 4px; }
.sep         { opacity: 0.4; }
.entry-time  { display: flex; align-items: center; gap: 5px; font-family: 'Rajdhani', sans-serif; font-size: 0.75rem; color: var(--text-dim); }

.mini-board {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
  width: 66px; flex-shrink: 0; padding: 5px;
  background: rgba(6, 18, 38, 0.7);
  border: 1px solid rgba(26, 159, 255, 0.1); border-radius: 10px;
}
.mini-cell {
  aspect-ratio: 1; border-radius: 4px; background: rgba(255,255,255,0.03);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Share Tech Mono', monospace; font-size: 0.58rem; font-weight: 700;
}
.mini-x { color: var(--blue-glow);   background: rgba(26, 159, 255, 0.1); }
.mini-o { color: var(--pink-accent); background: rgba(240, 96, 176, 0.1); }

.meta-icon       { font-size: 0.9rem; flex-shrink: 0; }
.meta-icon--blue { color: var(--blue-glow); filter: drop-shadow(0 0 4px rgba(26,159,255,0.5)); }
.meta-icon--gold { color: var(--gold);      filter: drop-shadow(0 0 4px rgba(240,192,96,0.5)); }
.meta-icon--dim  { color: var(--text-dim); }

.entry-location, .entry-no-location {
  display: flex; align-items: center; gap: 7px;
  font-family: 'Rajdhani', sans-serif; font-size: 0.82rem; color: var(--text-dim);
}
.city-name   { color: var(--text-main); font-weight: 600; letter-spacing: 0.5px; }
.mono.coords { font-family: 'Share Tech Mono', monospace; font-size: 0.72rem; color: var(--text-dim); }

.entry-weather { display: flex; align-items: center; gap: 7px; font-family: 'Rajdhani', sans-serif; font-size: 0.85rem; color: var(--text-dim); }
.weather-emoji { font-size: 1rem; }
.weather-label { flex: 1; }
.weather-temp  { font-family: 'Share Tech Mono', monospace; font-size: 0.9rem; font-weight: 700; color: var(--blue-glow); }

/* ── Transitions ── */
.slide-in-enter-active { animation: slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-in-leave-active { animation: slideIn 0.2s reverse ease-in; }
@keyframes slideIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Tablet ── */
@media (min-width: 768px) {
  .history-list { padding: 14px 24px 0; }
  .stats-strip  { padding: 16px 24px 4px; gap: 12px; }
  .mini-board   { width: 80px; }
  .history-card { padding: 14px 18px; }
  .match-name   { font-size: 1.05rem; }
  .geo-block    { padding: 16px 24px 8px; }
}

@media (min-width: 1024px) {
  .list-inner { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
}
</style>

<style>
.dark-alert { --background: #0d1a2e; --color: #c8dff8; }
.dark-alert .alert-title   { font-family: 'Rajdhani', sans-serif !important; color: #1a9fff !important; letter-spacing: 2px; }
.dark-alert .alert-message { font-family: 'Rajdhani', sans-serif !important; color: #5a7a9a !important; }
.dark-alert .alert-btn-danger { color: #f06060 !important; }
</style>