import type { AppState } from './types'

const KEY = 'minus40.app-state'
const fallback: AppState = { entries: [], startWeight: 150, targetWeight: 110 }

export function normalizeState(value: unknown): AppState {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as { entries?: unknown }).entries) ||
    !Number.isFinite((value as { startWeight?: unknown }).startWeight) ||
    !Number.isFinite((value as { targetWeight?: unknown }).targetWeight)
  ) {
    return fallback
  }

  return {
    startWeight: (value as AppState).startWeight,
    targetWeight: (value as AppState).targetWeight,
    entries: (value as AppState).entries
      .filter(
        (x: unknown) =>
          typeof (x as { id?: unknown })?.id === 'string' &&
          Number.isFinite((x as { date?: unknown }).date) &&
          Number.isFinite((x as { weight?: unknown }).weight),
      )
      .sort((a: { date: number }, b: { date: number }) => b.date - a.date),
  }
}

export function loadState(): AppState {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '')
    return normalizeState(value)
  } catch { return fallback }
}

export function saveState(state: AppState): void { localStorage.setItem(KEY, JSON.stringify(state)) }
