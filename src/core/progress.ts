import type { AppState, WeightEntry } from './types'
export const MILESTONES = [150, 140, 130, 125, 120, 115, 110]
export const PLATEAU_ROUTE = [150, 140, 130, 125, 120, 115, 110]
export const PLATEAU_DURATION_DAYS = 7

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

export type HistoryRange = 'week' | 'month' | 'year'
export type ChartRange = 'week' | 'month' | 'year'
export type PlateauStage = 'cut' | 'plateau'
export type MilestoneStatus = 'pending' | 'reached' | 'temporarilyLost'

const plateauFacts = (state: AppState) => ({
  plateauStartedAt: state.plateauStartedAt ?? null,
  lastConfirmedMilestone: state.lastConfirmedMilestone ?? null,
  plateauStartWeight: state.plateauStartWeight ?? null,
})

export function plateauEndsAt(state: AppState): number | null {
  const { plateauStartedAt } = plateauFacts(state)

  return plateauStartedAt === null ? null : plateauStartedAt + PLATEAU_DURATION_DAYS * DAY
}

export function isPlateauActive(state: AppState, now = Date.now()): boolean {
  const endsAt = plateauEndsAt(state)

  return endsAt !== null && now < endsAt
}

export function currentStage(state: AppState, now = Date.now()): PlateauStage {
  return isPlateauActive(state, now) ? 'plateau' : 'cut'
}

export function routeMilestones(): number[] {
  return PLATEAU_ROUTE
}

export function plateauBounds(state: AppState): { top: number | null; bottom: number | null } {
  const { lastConfirmedMilestone, plateauStartWeight } = plateauFacts(state)

  if (lastConfirmedMilestone === null) {
    return { top: null, bottom: plateauStartWeight }
  }

  if (plateauStartWeight !== null) {
    return {
      top: lastConfirmedMilestone,
      bottom: plateauStartWeight,
    }
  }

  return {
    top: lastConfirmedMilestone,
    bottom: null,
  }
}

export function plateauFillCount(state: AppState, now = Date.now(), segments = 7): number {
  const startedAt = plateauFacts(state).plateauStartedAt
  const endsAt = plateauEndsAt(state)

  if (startedAt === null || endsAt === null || endsAt <= startedAt) {
    return 0
  }

  const elapsedDays = Math.floor(clamp(now - startedAt, 0, endsAt - startedAt) / DAY)

  return Math.max(0, Math.min(segments, elapsedDays))
}

export function currentActiveMilestone(state: AppState): number | null {
  const current = currentWeight(state)
  const { lastConfirmedMilestone } = plateauFacts(state)
  const route = routeMilestones()

  if (current === null) return null

  if (lastConfirmedMilestone !== null) {
    const confirmedIndex = route.indexOf(lastConfirmedMilestone)

    if (confirmedIndex >= 0) {
      return route[confirmedIndex + 1] ?? null
    }
  }

  return route.find((milestone) => current > milestone) ?? null
}

export function nextRouteMilestone(state: AppState): number | null {
  return currentActiveMilestone(state)
}

export function milestoneStatus(state: AppState, milestone: number): MilestoneStatus {
  const current = currentWeight(state)
  const { lastConfirmedMilestone } = plateauFacts(state)

  if (current === null) return 'pending'

  if (lastConfirmedMilestone === milestone) {
    return current > milestone ? 'temporarilyLost' : 'reached'
  }

  const route = routeMilestones()
  const confirmedIndex = lastConfirmedMilestone === null ? -1 : route.indexOf(lastConfirmedMilestone)
  const milestoneIndex = route.indexOf(milestone)

  if (milestoneIndex === -1) return 'pending'
  if (confirmedIndex === -1) {
    return current <= milestone ? 'reached' : 'pending'
  }
  if (milestoneIndex < confirmedIndex) return 'reached'
  if (milestoneIndex === confirmedIndex) return current > milestone ? 'temporarilyLost' : 'reached'

  return current <= milestone ? 'reached' : 'pending'
}

export function isMilestoneTemporarilyLost(state: AppState, milestone: number): boolean {
  return milestoneStatus(state, milestone) === 'temporarilyLost'
}

export function milestoneStates(state: AppState): Array<{ milestone: number; status: MilestoneStatus }> {
  return routeMilestones().map((milestone) => ({
    milestone,
    status: milestoneStatus(state, milestone),
  }))
}

export function currentRouteProgress(state: AppState): {
  stage: PlateauStage
  currentMilestone: number | null
  nextMilestone: number | null
  plateauEndsAt: number | null
  temporarilyLostMilestone: number | null
  milestones: Array<{ milestone: number; status: MilestoneStatus }>
} {
  return currentRouteProgressAt(state, Date.now())
}

export function currentRouteProgressAt(
  state: AppState,
  now: number,
): {
  stage: PlateauStage
  currentMilestone: number | null
  nextMilestone: number | null
  plateauEndsAt: number | null
  temporarilyLostMilestone: number | null
  milestones: Array<{ milestone: number; status: MilestoneStatus }>
} {
  const currentMilestone = currentActiveMilestone(state)
  const route = routeMilestones()
  const currentIndex = currentMilestone === null ? -1 : route.indexOf(currentMilestone)
  const lostMilestone = milestoneStates(state).find((item) => item.status === 'temporarilyLost')?.milestone ?? null

  return {
    stage: currentStage(state, now),
    currentMilestone,
    nextMilestone: currentIndex >= 0 ? route[currentIndex + 1] ?? null : null,
    plateauEndsAt: plateauEndsAt(state),
    temporarilyLostMilestone: lostMilestone,
    milestones: milestoneStates(state),
  }
}

export function historyExtremes(entries: WeightEntry[], range: HistoryRange): { best: number | null; worst: number | null } {
  if (entries.length < 2) return { best: null, worst: null }

  const newest = entries[0]
  const windowDays = range === 'week' ? 7 : range === 'month' ? 30 : 365
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

export function forecastDaysToMilestone(state: AppState): { days: number; basis: 'weekly' | 'provisional' } | null {
  const current = currentWeight(state)
  const milestone = nextMilestone(state)

  if (current === null || milestone === null) return null

  const newest = state.entries[0]
  if (!newest) return null

  const windowStart = newest.date - 7 * DAY
  const recentEntries = state.entries.filter((entry) => entry.date >= windowStart)

  if (recentEntries.length < 2) return null

  const oldest = recentEntries[recentEntries.length - 1]
  const days = Math.max((newest.date - oldest.date) / DAY, 1)
  const dailyRate = (newest.weight - oldest.weight) / days

  if (dailyRate === 0) return null

  return { days: Math.max(1, Math.ceil((current - milestone) / Math.abs(dailyRate))), basis: 'weekly' }
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

export function filterEntriesByRange(entries: WeightEntry[], range: ChartRange) {
  if (entries.length < 2) return entries

  const newest = entries[0]
  const windowDays = range === 'week' ? 7 : range === 'month' ? 30 : 365
  const cutoff = newest.date - windowDays * DAY
  const filtered = entries.filter((entry) => entry.date >= cutoff)

  return filtered.length ? filtered : [entries[0]]
}

export function averagePeriodChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null

  const newest = entries[0]
  const oldest = entries[entries.length - 1]
  const days = Math.max((newest.date - oldest.date) / DAY, 1)

  return (newest.weight - oldest.weight) / days
}

export function longestLossStreak(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null

  const chronological = [...entries].reverse()
  let current = 1
  let best = 1

  for (let index = 1; index < chronological.length; index += 1) {
    const delta = chronological[index].weight - chronological[index - 1].weight

    if (delta <= 0) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }

  return best
}

export function monthlyCalendarChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null

  const newest = entries[0]
  const newestDate = new Date(newest.date)
  const month = newestDate.getMonth()
  const year = newestDate.getFullYear()
  const monthlyEntries = entries.filter((entry) => {
    const date = new Date(entry.date)

    return date.getMonth() === month && date.getFullYear() === year
  })

  if (monthlyEntries.length < 2) return null

  const oldest = monthlyEntries[monthlyEntries.length - 1]

  return newest.weight - oldest.weight
}

export function daysInJourney(entries: WeightEntry[]): number | null {
  if (!entries.length) return null

  const newest = entries[0]
  const oldest = entries[entries.length - 1]

  return Math.max(Math.round((newest.date - oldest.date) / DAY) + 1, 1)
}
