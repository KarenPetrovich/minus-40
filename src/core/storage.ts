import type { AppState } from './types'

const KEY = 'minus40.app-state'
const fallback: AppState = {
  startWeight: 150.5,
  targetWeight: 110,
  entries: [
    { id: 'restore-2026-06-26', date: Date.parse('2026-06-26T12:00:00+03:00'), weight: 146.4 },
    { id: 'restore-2026-06-25', date: Date.parse('2026-06-25T12:00:00+03:00'), weight: 148.2 },
    { id: 'restore-2026-06-24', date: Date.parse('2026-06-24T12:00:00+03:00'), weight: 150.5 },
  ],
}

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
