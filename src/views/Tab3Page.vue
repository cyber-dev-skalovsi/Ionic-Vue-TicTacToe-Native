<template>
  <ion-page class="settings-page">
    <ion-header class="glass-header">
      <ion-toolbar class="glow-toolbar">
        <ion-title class="glow-title">
          <ion-icon :icon="settingsOutline" class="title-icon" />
          Settings
        </ion-title>
        <ion-buttons slot="end">
          <ion-button class="reset-header-btn" @click="confirmReset">
            <ion-icon :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dark-content">
      <div class="settings-scroll">

        <!-- ── Board Appearance ── -->
        <section class="settings-section">
          <div class="section-header">
            <ion-icon :icon="colorPaletteOutline" class="section-icon" />
            <span>Board Appearance</span>
          </div>

          <!-- Color presets -->
          <div class="presets-grid">
            <button
              v-for="preset in COLOR_PRESETS"
              :key="preset.label"
              class="preset-btn"
              :class="{ 'preset-active': form.boardBg === preset.bg }"
              :style="{ background: preset.bg }"
              @click="form.boardBg = preset.bg; persist()"
            >
              <div class="preset-symbols">
                <span class="sym-x">X</span>
                <span class="sym-o">O</span>
              </div>
              <span class="preset-label">{{ preset.label }}</span>
            </button>
          </div>

          <!-- Custom hex input -->
          <div class="custom-color-row">
            <div class="setting-row">
              <div class="setting-label">
                <ion-icon :icon="brushOutline" class="row-icon" />
                Custom Background
              </div>
              <div class="color-picker-wrap">
                <input
                  type="color"
                  class="native-color-input"
                  :value="hexFromBg(form.boardBg)"
                  @input="onColorInput"
                />
                <div class="color-swatch" :style="{ background: form.boardBg }"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Game Identity ── -->
        <section class="settings-section">
          <div class="section-header">
            <ion-icon :icon="gameControllerOutline" class="section-icon" />
            <span>Game Identity</span>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <ion-icon :icon="createOutline" class="row-icon" />
              Default Game Name
            </div>
            <ion-input
              class="glow-input"
              v-model="form.gameName"
              placeholder="TacTic Board"
              @ionBlur="persist"
            />
          </div>
        </section>

        <!-- ── Player Names ── -->
        <section class="settings-section">
          <div class="section-header">
            <ion-icon :icon="peopleOutline" class="section-icon" />
            <span>Player Names</span>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span class="sym-x-sm">X</span>
              Player X
            </div>
            <ion-input
              class="glow-input glow-input--x"
              v-model="form.playerXName"
              placeholder="Player X"
              @ionBlur="persist"
            />
          </div>

          <div class="row-divider"></div>

          <div class="setting-row">
            <div class="setting-label">
              <span class="sym-o-sm">O</span>
              Player O
            </div>
            <ion-input
              class="glow-input glow-input--o"
              v-model="form.playerOName"
              placeholder="Player O"
              @ionBlur="persist"
            />
          </div>
        </section>

        <!-- ── Live Preview ── -->
        <section class="settings-section">
          <div class="section-header">
            <ion-icon :icon="eyeOutline" class="section-icon" />
            <span>Live Board Preview</span>
          </div>

          <div class="preview-wrap">
            <div class="preview-board" :style="{ background: form.boardBg }">
              <div v-for="(cell, i) in previewBoard" :key="i"
                class="preview-cell"
                :class="cell === 'X' ? 'preview-x' : cell === 'O' ? 'preview-o' : ''">
                <span v-if="cell" class="preview-sym">{{ cell }}</span>
              </div>
            </div>
            <div class="preview-labels">
              <span class="plabel plabel-x">{{ form.playerXName || 'Player X' }}</span>
              <span class="plabel plabel-o">{{ form.playerOName || 'Player O' }}</span>
            </div>
          </div>
        </section>

        <!-- ── Behaviour ── -->
        <section class="settings-section">
          <div class="section-header">
            <ion-icon :icon="phonePortraitOutline" class="section-icon" />
            <span>Behaviour</span>
          </div>

          <div class="setting-row setting-row--toggle">
            <div class="setting-label">
              <ion-icon :icon="phonePortraitOutline" class="row-icon" />
              <div class="toggle-text">
                <span>Shake to Reset</span>
                <span class="toggle-sub">Shake device to clear the board</span>
              </div>
            </div>
            <ion-toggle
              v-model="form.enableShake"
              color="primary"
              @ionChange="persist"
            />
          </div>

          <div class="row-divider"></div>

          <div class="setting-row setting-row--toggle">
            <div class="setting-label">
              <ion-icon :icon="flashOutline" class="row-icon" />
              <div class="toggle-text">
                <span>Haptic Feedback</span>
                <span class="toggle-sub">Vibrate on taps &amp; win</span>
              </div>
            </div>
            <ion-toggle
              v-model="form.enableHaptics"
              color="secondary"
              @ionChange="persist"
            />
          </div>
        </section>

        <!-- ── Danger Zone ── -->
        <section class="settings-section settings-section--danger">
          <ion-button expand="block" class="danger-btn" @click="confirmReset">
            <ion-icon :icon="trashOutline" slot="start" />
            Reset to Defaults
          </ion-button>
        </section>

        <div style="height: 40px"></div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonInput, IonToggle,
  alertController, toastController,
} from '@ionic/vue';
import {
  settingsOutline, colorPaletteOutline, gameControllerOutline, peopleOutline,
  createOutline, brushOutline, eyeOutline, phonePortraitOutline, flashOutline,
  trashOutline, refreshOutline,
} from 'ionicons/icons';
import {
  loadSettings, saveSettings, DEFAULT_SETTINGS, COLOR_PRESETS, AppSettings,
} from './settings';

// ── Form state ────────────────────────────────────────────────────────────────
const form = ref<AppSettings>(loadSettings());

const reload = () => { form.value = loadSettings(); };
onMounted(reload);
onActivated(reload);

const persist = () => saveSettings(form.value);

// ── Preview board layout ──────────────────────────────────────────────────────
const previewBoard = ['X', null, 'O', null, 'X', null, 'O', null, 'X'];

// ── Color helpers ─────────────────────────────────────────────────────────────
const hexFromBg = (bg: string): string => {
  // Try to extract hex if the value already is one; otherwise default
  const match = bg.match(/#([0-9a-fA-F]{6})/);
  return match ? match[0] : '#0d1a2e';
};

const onColorInput = (e: Event) => {
  const hex = (e.target as HTMLInputElement).value;
  form.value.boardBg = hex;
  persist();
};

// ── Reset ─────────────────────────────────────────────────────────────────────
const confirmReset = async () => {
  const alert = await alertController.create({
    header: 'Reset Settings',
    message: 'Restore all settings to their defaults?',
    cssClass: 'dark-alert',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Reset',
        role: 'destructive',
        cssClass: 'alert-btn-danger',
        handler: async () => {
          form.value = { ...DEFAULT_SETTINGS };
          saveSettings(form.value);
          const toast = await toastController.create({
            message: '✅ Settings reset to defaults',
            duration: 2000,
            position: 'top',
            cssClass: 'dark-toast',
          });
          toast.present();
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap');

.settings-page {
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
  font-size: 1.3rem;
  color: var(--blue-glow);
  text-shadow: 0 0 14px rgba(26, 159, 255, 0.8);
  letter-spacing: 3px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon { font-size: 1.1rem; }
.reset-header-btn { --color: var(--text-dim); }

.dark-content { --background: var(--bg-deep); --color: var(--text-main); }

/* ── Scroll container ── */
.settings-scroll {
  padding: 14px 14px 0;
}

@media (min-width: 768px) {
  .settings-scroll { padding: 20px 28px 0; }
}

/* ── Section ── */
.settings-section {
  background: rgba(13, 26, 46, 0.82);
  border: 1px solid rgba(26, 159, 255, 0.12);
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 14px;
  position: relative;
}

.settings-section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(26,159,255,0.4), transparent);
}

.settings-section--danger { background: rgba(30, 10, 10, 0.6); border-color: rgba(240, 60, 60, 0.2); padding: 14px; }
.settings-section--danger::before { background: linear-gradient(90deg, transparent, rgba(240,60,60,0.5), transparent); }

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  color: var(--text-dim);
  border-bottom: 1px solid rgba(26, 159, 255, 0.07);
}
.section-icon { font-size: 0.9rem; color: var(--blue-glow); }

/* ── Color presets grid ── */
.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 14px;
}

@media (min-width: 480px) { .presets-grid { grid-template-columns: repeat(6, 1fr); } }
@media (min-width: 768px) { .presets-grid { grid-template-columns: repeat(6, 1fr); } }

.preset-btn {
  border-radius: 12px;
  border: 1.5px solid rgba(26, 159, 255, 0.12);
  padding: 10px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-height: 64px;
}
.preset-btn:active { transform: scale(0.94); }
.preset-active {
  border-color: var(--blue-glow) !important;
  box-shadow: 0 0 14px rgba(26, 159, 255, 0.3);
}

.preset-symbols {
  display: flex;
  gap: 5px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.9rem;
  font-weight: 700;
}
.sym-x { color: #1a9fff; text-shadow: 0 0 8px rgba(26,159,255,0.8); }
.sym-o { color: #f060b0; text-shadow: 0 0 8px rgba(240,96,176,0.8); }

.preset-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-dim);
}

/* ── Setting row ── */
.setting-row {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 12px;
}

.setting-row--toggle { align-items: center; }

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: 0.5px;
  flex: 1;
  min-width: 0;
}
.row-icon { font-size: 1rem; color: var(--blue-glow); flex-shrink: 0; }

.toggle-text { display: flex; flex-direction: column; gap: 1px; }
.toggle-sub  { font-size: 0.72rem; color: var(--text-dim); letter-spacing: 0; font-weight: 400; }

.sym-x-sm { font-family: 'Share Tech Mono', monospace; font-weight: 700; font-size: 1rem; color: var(--blue-glow); text-shadow: 0 0 8px rgba(26,159,255,0.7); }
.sym-o-sm { font-family: 'Share Tech Mono', monospace; font-weight: 700; font-size: 1rem; color: var(--pink-accent); text-shadow: 0 0 8px rgba(240,96,176,0.7); }

/* Glow input */
.glow-input {
  --background: rgba(6, 18, 38, 0.9);
  --color: var(--text-main);
  --placeholder-color: var(--text-dim);
  --border-color: rgba(26, 159, 255, 0.2);
  --border-radius: 10px;
  --padding-start: 10px;
  --padding-end: 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  max-width: 160px;
  border: 1px solid rgba(26, 159, 255, 0.2);
  border-radius: 10px;
}
.glow-input--x { border-color: rgba(26, 159, 255, 0.3); }
.glow-input--o { border-color: rgba(240, 96, 176, 0.3); }

/* Color picker */
.custom-color-row { padding: 0 14px 12px; }
.color-picker-wrap { display: flex; align-items: center; gap: 8px; }

.native-color-input {
  width: 38px; height: 38px;
  border: none; border-radius: 8px;
  padding: 2px; cursor: pointer;
  background: none; outline: none;
}
.color-swatch {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(26, 159, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
}

.row-divider {
  height: 1px;
  background: rgba(26, 159, 255, 0.06);
  margin: 0 14px;
}

/* ── Live Preview ── */
.preview-wrap {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.preview-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(26, 159, 255, 0.15);
  width: 160px;
  transition: background 0.4s ease;
  box-shadow: 0 4px 24px rgba(26, 159, 255, 0.1);
}

.preview-cell {
  aspect-ratio: 1;
  background: rgba(6, 18, 38, 0.8);
  border: 1px solid rgba(26, 159, 255, 0.08);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-x { border-color: rgba(26, 159, 255, 0.25); background: rgba(26, 159, 255, 0.06); }
.preview-o { border-color: rgba(240, 96, 176, 0.25); background: rgba(240, 96, 176, 0.06); }

.preview-sym {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
}
.preview-x .preview-sym { color: var(--blue-glow); text-shadow: 0 0 10px rgba(26,159,255,0.9); }
.preview-o .preview-sym { color: var(--pink-accent); text-shadow: 0 0 10px rgba(240,96,176,0.9); }

.preview-labels { display: flex; gap: 24px; }
.plabel {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.plabel-x { color: var(--blue-glow); }
.plabel-o { color: var(--pink-accent); }

/* ── Danger button ── */
.danger-btn {
  --background: rgba(180, 30, 30, 0.2);
  --background-activated: rgba(220, 40, 40, 0.35);
  --border-radius: 12px;
  --color: #f06060;
  --box-shadow: none;
  border: 1px solid rgba(240, 60, 60, 0.3);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 0.9rem;
}
</style>

<style>
.dark-alert { --background: #0d1a2e; --color: #c8dff8; }
.dark-alert .alert-title   { font-family: 'Rajdhani', sans-serif !important; color: #1a9fff !important; letter-spacing: 2px; }
.dark-alert .alert-message { font-family: 'Rajdhani', sans-serif !important; color: #5a7a9a !important; }
.dark-alert .alert-btn-danger { color: #f06060 !important; font-weight: 700 !important; }
.dark-toast { --background: #0d1a2e; --color: #c8dff8; font-family: 'Rajdhani', sans-serif; border: 1px solid rgba(26,159,255,0.25); border-radius: 12px; }
</style>