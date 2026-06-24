import type { AppState, WeightEntry } from './types'

export const MILESTONES = [150, 140, 130, 125, 120, 115, 110]
const DAY = 86_400_000
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
export const currentWeight = (state: AppState) => state.entries[0]?.weight ?? null
export const totalLost = (state: AppState) => { const current = currentWeight(state); return current === null ? 0 : state.startWeight - current }
export const percentToGoal = (state: AppState) => { const current = currentWeight(state); return current === null ? 0 : clamp(((state.startWeight - current) / (state.startWeight - state.targetWeight)) * 100, 0, 100) }
export const nextMilestone = (state: AppState) => { const current = currentWeight(state); return MILESTONES.find((m) => current === null || current > m) ?? null }
export const remainingToGoal = (state: AppState) => { const current = currentWeight(state); return current === null ? Math.max(state.startWeight - state.targetWeight, 0) : Math.max(current - state.targetWeight, 0) }
export const compareEntries = (entry: WeightEntry, older?: WeightEntry) => older ? entry.weight - older.weight : null
export function recentTrend(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null
  const newest = entries[0]
  const cutoff = newest.date - 14 * DAY
  const window = entries.filter((entry) => entry.date >= cutoff)
  const oldest = window[window.length - 1]
  if (!oldest || newest.date === oldest.date) return null
  return (newest.weight - oldest.weight) / ((newest.date - oldest.date) / DAY)
}
export function forecastDaysToMilestone(state: AppState): number | null {
  const current = currentWeight(state); const milestone = nextMilestone(state); const daily = recentTrend(state.entries)
  if (current === null || milestone === null || daily === null || daily >= 0) return null
  return Math.max(1, Math.ceil((current - milestone) / -daily))
}
export const formatWeight = (weight: number) => `${weight.toFixed(1).replace('.', ',')} кг`
export const formatDate = (date: number, short = false) => new Intl.DateTimeFormat('ru-RU', short ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date)).replace('.', '')
export function chartPoints(entries: WeightEntry[], width = 300, height = 150) {
  const chronological = [...entries].reverse(); if (!chronological.length) return [] as { x: number; y: number; weight: number; date: number }[]
  const weights = chronological.map((x) => x.weight); const min = Math.min(...weights); const max = Math.max(...weights); const range = max - min || 1
  return chronological.map((entry, index) => ({ x: chronological.length === 1 ? width / 2 : (index / (chronological.length - 1)) * width, y: height - 15 - ((entry.weight - min) / range) * (height - 30), weight: entry.weight, date: entry.date }))
}
