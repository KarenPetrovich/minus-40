import type { AppState, WeightEntry } from './types'

export const MILESTONES = [150, 140, 130, 125, 120, 115, 110]

const DAY = 86_400_000

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const currentWeight = (state: AppState) => state.entries[0]?.weight ?? null

export const totalLost = (state: AppState) => {
  const current = currentWeight(state)

  return current === null ? 0 : state.startWeight - current
}

export const nextMilestone = (state: AppState) => {
  const current = currentWeight(state)

  return MILESTONES.find((milestone) => current === null || current > milestone) ?? null
}

export const percentToMilestone = (state: AppState) => {
  const current = currentWeight(state)
  const milestone = nextMilestone(state)

  if (current === null || milestone === null) return 0
  if (current <= milestone) return 100

  return clamp(((state.startWeight - current) / (state.startWeight - milestone)) * 100, 0, 100)
}

export const remainingToMilestone = (state: AppState) => {
  const current = currentWeight(state)
  const milestone = nextMilestone(state)

  if (current === null || milestone === null) return null

  return Math.max(current - milestone, 0)
}

export const compareEntries = (entry: WeightEntry, older?: WeightEntry) => (older ? entry.weight - older.weight : null)

export type HistoryRange = 'week' | 'month'

export function historyExtremes(entries: WeightEntry[], range: HistoryRange): { best: number | null; worst: number | null } {
  if (entries.length < 2) return { best: null, worst: null }

  const newest = entries[0]
  const windowDays = range === 'week' ? 7 : 30
  const cutoff = newest.date - windowDays * DAY
  const deltas = entries
    .map((entry, index) => {
      const older = entries[index + 1]
      const delta = compareEntries(entry, older)

      if (delta === null || entry.date < cutoff) return null

      return delta
    })
    .filter((delta): delta is number => delta !== null)

  if (!deltas.length) return { best: null, worst: null }

  const losses = deltas.filter((delta) => delta < 0)
  const gains = deltas.filter((delta) => delta > 0)

  return {
    best: losses.length ? Math.min(...losses) : null,
    worst: gains.length ? Math.max(...gains) : null,
  }
}

export function weeklyChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null

  const newest = entries[0]
  const cutoff = newest.date - 7 * DAY
  const reference = entries.find((entry) => entry.date <= cutoff)

  if (!reference) return null

  return newest.weight - reference.weight
}

function averageDailyChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null

  const newest = entries[0]
  const oldest = entries[entries.length - 1]

  if (!oldest || newest.date === oldest.date) return null

  return (newest.weight - oldest.weight) / ((newest.date - oldest.date) / DAY)
}

export function forecastDaysToMilestone(state: AppState): { days: number; basis: 'weekly' | 'provisional' } | null {
  const current = currentWeight(state)
  const milestone = nextMilestone(state)
  const weekly = weeklyChange(state.entries)

  if (current === null || milestone === null) return null

  if (weekly !== null && weekly < 0) {
    const dailyRate = weekly / 7

    return { days: Math.max(1, Math.ceil((current - milestone) / -dailyRate)), basis: 'weekly' }
  }

  const provisionalDaily = averageDailyChange(state.entries)

  if (provisionalDaily === null || provisionalDaily >= 0) return null

  return { days: Math.max(1, Math.ceil((current - milestone) / -provisionalDaily)), basis: 'provisional' }
}

export const formatWeight = (weight: number) => `${weight.toFixed(1).replace('.', ',')} кг`

export const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}`

export const formatDate = (date: number, short = false) =>
  new Intl.DateTimeFormat('ru-RU', short ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(date))
    .replace('.', '')

export const formatMonth = (date: number) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'long' })
    .format(new Date(date))
    .replace('.', '')

export function chartPoints(entries: WeightEntry[], width = 300, height = 150) {
  const chronological = [...entries].reverse()

  if (!chronological.length) return [] as { x: number; y: number; weight: number; date: number }[]

  const weights = chronological.map((entry) => entry.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  return chronological.map((entry, index) => ({
    x: chronological.length === 1 ? width / 2 : (index / (chronological.length - 1)) * width,
    y: height - 15 - ((entry.weight - min) / range) * (height - 30),
    weight: entry.weight,
    date: entry.date,
  }))
}
