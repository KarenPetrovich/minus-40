import {
  clearLegacyState,
  loadCloudMeta,
  loadInitialState,
  loadLegacyState,
  normalizeState,
  saveCachedState,
  saveCloudMeta,
} from './storage'
import type { AppState, Comment, CommentTargetType } from './types'
import { bootstrapCloudState, canUseCloudSync, replaceCloudState } from '../features/sync/cloud'
import { getTelegramInitData } from '../features/telegram/webapp'
import { currentStage, routeMilestones } from './progress'

type PlateauFacts = {
  plateauStartedAt: number | null
  lastConfirmedMilestone: number | null
  plateauStartWeight: number | null
}

export type RefreshSource = 'supabase' | 'local-cache' | 'unavailable'

export type RefreshOutcome = {
  source: RefreshSource
  usedLocalCache: boolean
}

type StoreState = AppState & PlateauFacts

export type CommentDraft = {
  targetType: CommentTargetType
  targetKey: string
  text: string
}

const withPlateauFacts = (
  nextState: AppState,
  fallback: PlateauFacts = { plateauStartedAt: null, lastConfirmedMilestone: null, plateauStartWeight: null },
): StoreState => ({
  ...normalizeState(nextState),
  plateauStartedAt: nextState.plateauStartedAt ?? fallback.plateauStartedAt,
  lastConfirmedMilestone: nextState.lastConfirmedMilestone ?? fallback.lastConfirmedMilestone,
  plateauStartWeight: nextState.plateauStartWeight ?? fallback.plateauStartWeight,
})

let state: StoreState = withPlateauFacts(loadInitialState())
const listeners = new Set<() => void>()
let bootstrapPromise: Promise<RefreshOutcome> | null = null
let cloudSyncEnabled = loadCloudMeta().cloudMode
let syncQueue = Promise.resolve()

const emit = () => {
  saveCachedState(state)
  listeners.forEach((listener) => listener())
}

function mergeCommentsWithLocalFallback(nextState: AppState, fallbackState: StoreState): AppState {
  if ((nextState.comments?.length ?? 0) > 0 || fallbackState.comments.length === 0) {
    return nextState
  }

  return {
    ...nextState,
    comments: fallbackState.comments,
  }
}

function commitMilestoneProgress(previousState: StoreState, nextState: StoreState, weight: number, date: number): StoreState {
  if (currentStage(previousState, date) === 'plateau') {
    return nextState
  }

  const route = routeMilestones().slice(1)
  const confirmedIndex = previousState.lastConfirmedMilestone === null ? -1 : route.indexOf(previousState.lastConfirmedMilestone)
  const startIndex = Math.max(confirmedIndex + 1, 0)
  const milestone = route.slice(startIndex).find((item) => weight <= item) ?? null

  if (milestone === null || weight > milestone) {
    return nextState
  }

  return {
    ...nextState,
    plateauStartedAt: date,
    lastConfirmedMilestone: milestone,
    plateauStartWeight: weight,
  }
}

function normalizeCommentText(text: string): string {
  return text.trim()
}

function upsertCommentInState(currentState: StoreState, draft: CommentDraft): StoreState {
  const text = normalizeCommentText(draft.text)
  const nextComments = currentState.comments.filter(
    (comment) => !(comment.targetType === draft.targetType && comment.targetKey === draft.targetKey),
  )

  if (!text) {
    return {
      ...currentState,
      comments: nextComments,
    }
  }

  const existing = currentState.comments.find(
    (comment) => comment.targetType === draft.targetType && comment.targetKey === draft.targetKey,
  )
  const now = Date.now()

  const nextComment: Comment = existing
    ? {
        ...existing,
        text,
        updatedAt: now,
      }
    : {
        id: crypto.randomUUID(),
        userId: 'local',
        targetType: draft.targetType,
        targetKey: draft.targetKey,
        text,
        createdAt: now,
        updatedAt: now,
      }

  return {
    ...currentState,
    comments: [...nextComments, nextComment],
  }
}

function deleteCommentInState(currentState: StoreState, targetType: CommentTargetType, targetKey: string): StoreState {
  return {
    ...currentState,
    comments: currentState.comments.filter(
      (comment) => !(comment.targetType === targetType && comment.targetKey === targetKey),
    ),
  }
}

function queueCloudReplace(snapshot: AppState): Promise<void> {
  if (!cloudSyncEnabled || !canUseCloudSync()) {
    return Promise.resolve()
  }

  const initData = getTelegramInitData()

  if (!initData) {
    return Promise.resolve()
  }

  const normalizedSnapshot = normalizeState(snapshot)

  syncQueue = syncQueue
    .catch(() => undefined)
    .then(async () => {
      await replaceCloudState(initData, normalizedSnapshot)
      saveCloudMeta({
        cloudMode: true,
        lastSyncedAt: Date.now(),
      })
    })
    .catch((error) => {
      console.error('Cloud sync failed', error)
    })

  return syncQueue
}

async function bootstrapFromCloud(forceRefresh = false): Promise<RefreshOutcome> {
  return bootstrapFromCloudWithInitData(getTelegramInitData(), forceRefresh)
}

async function bootstrapFromCloudWithInitData(initData: string, forceRefresh = false): Promise<RefreshOutcome> {
  if (!canUseCloudSync()) {
    return { source: 'unavailable', usedLocalCache: false }
  }

  if (!initData) {
    return { source: 'unavailable', usedLocalCache: false }
  }

  const legacyState = loadLegacyState()

  try {
    const response = await bootstrapCloudState(initData, forceRefresh ? null : legacyState)
    const mergedState = mergeCommentsWithLocalFallback(response.state, state)
    const needsCommentsBackfill =
      (response.state.comments?.length ?? 0) === 0 &&
      mergedState.comments.length > 0

    cloudSyncEnabled = true
    state = withPlateauFacts(mergedState, state)
    emit()
    clearLegacyState()
    saveCloudMeta({
      cloudMode: true,
      legacyMigrated: response.meta.source === 'migrated' || loadCloudMeta().legacyMigrated,
      lastSyncedAt: Date.now(),
    })

    if (needsCommentsBackfill) {
      queueCloudReplace(state)
    }

    return { source: 'supabase', usedLocalCache: false }
  } catch (error) {
    console.error('Cloud bootstrap failed', error)
    return { source: 'local-cache', usedLocalCache: true }
  }
}

export const weightStore = {
  getSnapshot: () => state,
  rehydrate() {
    state = withPlateauFacts(loadInitialState())
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)

    return () => listeners.delete(listener)
  },
  async bootstrap() {
    if (bootstrapPromise) {
      return bootstrapPromise
    }

    bootstrapPromise = bootstrapFromCloud(false).finally(() => {
      bootstrapPromise = null
    })

    return bootstrapPromise
  },
  async refresh(): Promise<RefreshOutcome> {
    if (!cloudSyncEnabled && !canUseCloudSync()) {
      return { source: 'unavailable', usedLocalCache: false }
    }

    return bootstrapFromCloud(true)
  },
  async refreshFromCloud(initData: string): Promise<RefreshOutcome> {
    if (!cloudSyncEnabled && !canUseCloudSync()) {
      return { source: 'unavailable', usedLocalCache: false }
    }

    return bootstrapFromCloudWithInitData(initData, true)
  },
  addWeight(weight: number, date = Date.now()) {
    const snapshot = withPlateauFacts({
      ...state,
      entries: [{ id: crypto.randomUUID(), date, weight }, ...state.entries].sort((left, right) => right.date - left.date),
    }, state)
    state = commitMilestoneProgress(state, snapshot, weight, date)
    emit()
    queueCloudReplace(state)
  },
  deleteEntry(id: string) {
    state = withPlateauFacts({
      ...state,
      entries: state.entries.filter((entry) => entry.id !== id),
    }, state)
    emit()
    queueCloudReplace(state)
  },
  updateSettings(startWeight: number, targetWeight: number) {
    state = withPlateauFacts({
      ...state,
      startWeight,
      targetWeight,
    }, state)
    emit()
    queueCloudReplace(state)
  },
  exportState() {
    return JSON.stringify(state, null, 2)
  },
  importState(nextState: AppState) {
    state = withPlateauFacts(nextState, state)
    emit()
    queueCloudReplace(state)
  },
  getCommentByTarget(targetType: CommentTargetType, targetKey: string) {
    return state.comments.find((comment) => comment.targetType === targetType && comment.targetKey === targetKey) ?? null
  },
  async upsertComment(draft: CommentDraft) {
    state = withPlateauFacts(upsertCommentInState(state, draft), state)
    emit()
    await queueCloudReplace(state)
  },
  async deleteComment(targetType: CommentTargetType, targetKey: string) {
    state = withPlateauFacts(deleteCommentInState(state, targetType, targetKey), state)
    emit()
    await queueCloudReplace(state)
  },
  async trimEmptyComments() {
    state = withPlateauFacts({
      ...state,
      comments: state.comments.filter((comment) => comment.text.trim().length > 0),
    }, state)
    emit()
    await queueCloudReplace(state)
  },
}
