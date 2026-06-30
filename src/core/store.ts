import {
  clearLegacyState,
  loadCloudMeta,
  loadInitialState,
  loadLegacyState,
  normalizeState,
  saveCachedState,
  saveCloudMeta,
} from './storage'
import type { AppState } from './types'
import { bootstrapCloudState, canUseCloudSync, replaceCloudState } from '../features/sync/cloud'
import { getTelegramInitData } from '../features/telegram/webapp'
import { currentStage, routeMilestones } from './progress'

type PlateauFacts = {
  plateauStartedAt: number | null
  lastConfirmedMilestone: number | null
  plateauStartWeight: number | null
}

type StoreState = AppState & PlateauFacts

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
let bootstrapPromise: Promise<void> | null = null
let cloudSyncEnabled = loadCloudMeta().cloudMode
let syncQueue = Promise.resolve()

const emit = () => {
  saveCachedState(state)
  listeners.forEach((listener) => listener())
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

function queueCloudReplace(snapshot: AppState): void {
  if (!cloudSyncEnabled || !canUseCloudSync()) {
    return
  }

  const initData = getTelegramInitData()

  if (!initData) {
    return
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
}

async function bootstrapFromCloud(forceRefresh = false): Promise<void> {
  await bootstrapFromCloudWithInitData(getTelegramInitData(), forceRefresh)
}

async function bootstrapFromCloudWithInitData(initData: string, forceRefresh = false): Promise<void> {
  if (!canUseCloudSync()) {
    return
  }

  if (!initData) {
    return
  }

  const legacyState = loadLegacyState()

  try {
    const response = await bootstrapCloudState(initData, forceRefresh ? null : legacyState)

    cloudSyncEnabled = true
    state = withPlateauFacts(response.state, state)
    emit()
    clearLegacyState()
    saveCloudMeta({
      cloudMode: true,
      legacyMigrated: response.meta.source === 'migrated' || loadCloudMeta().legacyMigrated,
      lastSyncedAt: Date.now(),
    })
  } catch (error) {
    console.error('Cloud bootstrap failed', error)
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
  async refresh() {
    if (!cloudSyncEnabled && !canUseCloudSync()) {
      return
    }

    await bootstrapFromCloud(true)
  },
  async refreshFromCloud(initData: string) {
    if (!cloudSyncEnabled && !canUseCloudSync()) {
      return
    }

    await bootstrapFromCloudWithInitData(initData, true)
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
}
