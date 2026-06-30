export type WeightEntry = { id: string; date: number; weight: number }
export type AppState = {
  entries: WeightEntry[]
  startWeight: number
  targetWeight: number
  plateauStartedAt?: number | null
  lastConfirmedMilestone?: number | null
  plateauStartWeight?: number | null
}
export type Screen = 'overview' | 'history' | 'graph' | 'settings'
