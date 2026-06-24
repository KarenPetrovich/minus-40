export type WeightEntry = { id: string; date: number; weight: number }
export type AppState = { entries: WeightEntry[]; startWeight: number; targetWeight: number }
export type Screen = 'overview' | 'history' | 'graph' | 'settings'
