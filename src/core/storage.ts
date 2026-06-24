import type { AppState } from './types'

const KEY = 'minus40.app-state'
const fallback: AppState = { entries: [], startWeight: 150, targetWeight: 110 }

export function loadState(): AppState {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '')
    if (!value || !Array.isArray(value.entries) || !Number.isFinite(value.startWeight) || !Number.isFinite(value.targetWeight)) return fallback
    return { ...value, entries: value.entries.filter((x: unknown) => typeof (x as { id?: unknown })?.id === 'string' && Number.isFinite((x as { date?: unknown }).date) && Number.isFinite((x as { weight?: unknown }).weight)).sort((a: { date: number }, b: { date: number }) => b.date - a.date) }
  } catch { return fallback }
}

export function saveState(state: AppState): void { localStorage.setItem(KEY, JSON.stringify(state)) }
