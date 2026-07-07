export type WeightEntry = { id: string; date: number; weight: number }
export type CommentTargetType = 'milestone' | 'weight_entry'
export type Comment = {
  id: string
  userId: string
  targetType: CommentTargetType
  targetKey: string
  text: string
  createdAt: number
  updatedAt: number
}
export type AppState = {
  entries: WeightEntry[]
  comments: Comment[]
  startWeight: number
  targetWeight: number
  plateauStartedAt?: number | null
  lastConfirmedMilestone?: number | null
  plateauStartWeight?: number | null
}
export type Screen = 'overview' | 'history' | 'graph' | 'settings'
