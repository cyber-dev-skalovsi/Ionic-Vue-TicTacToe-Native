// settings.ts — shared settings store (localStorage-backed)
// Import this in Tab1Page.vue and Tab3Page.vue

export interface AppSettings {
  gameName:    string;
  playerXName: string;
  playerOName: string;
  boardBg:     string;
  enableHaptics:   boolean;
  enableShake:     boolean;
}

export const SETTINGS_KEY = 'tactic_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  gameName:    'TacTic Board',
  playerXName: 'Player X',
  playerOName: 'Player O',
  boardBg:     'rgba(13, 26, 46, 0.75)',
  enableHaptics:   true,
  enableShake:     true,
};

export const COLOR_PRESETS = [
  { label: 'Default',  bg: 'rgba(13, 26, 46, 0.75)' },
  { label: 'Deep Navy', bg: 'rgba(5, 20, 50, 0.9)' },
  { label: 'Midnight',  bg: 'rgba(15, 10, 30, 0.92)' },
  { label: 'Forest',    bg: 'rgba(8, 30, 20, 0.88)' },
  { label: 'Crimson',   bg: 'rgba(35, 8, 8, 0.9)' },
  { label: 'Slate',     bg: 'rgba(20, 20, 28, 0.9)' },
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* storage unavailable */ }
}