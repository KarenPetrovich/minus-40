import type { WeightEntry } from './types'

const STORAGE_KEY = 'minus40.weightEntries'

export function loadWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as WeightEntry[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (entry) =>
          typeof entry?.id === 'string' &&
          typeof entry?.date === 'string' &&
          typeof entry?.weight === 'number',
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export function saveWeightEntries(entries: WeightEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
