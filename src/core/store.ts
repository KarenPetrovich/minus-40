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

let state = loadInitialState()
const listeners = new Set<() => void>()
let bootstrapPromise: Promise<void> | null = null
let cloudSyncEnabled = loadCloudMeta().cloudMode
let syncQueue = Promise.resolve()

const emit = () => {
  saveCachedState(state)
  listeners.forEach((listener) => listener())
}

function setState(nextState: AppState): void {
  state = normalizeState(nextState)
  emit()
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
  if (!canUseCloudSync()) {
    return
  }

  const initData = getTelegramInitData()

  if (!initData) {
    return
  }

  const legacyState = loadLegacyState()

  try {
    const response = await bootstrapCloudState(initData, forceRefresh ? null : legacyState)

    cloudSyncEnabled = true
    setState(response.state)
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
  addWeight(weight: number, date = Date.now()) {
    state = {
      ...state,
      entries: [{ id: crypto.randomUUID(), date, weight }, ...state.entries].sort((left, right) => right.date - left.date),
    }
    emit()
    queueCloudReplace(state)
  },
  deleteEntry(id: string) {
    state = {
      ...state,
      entries: state.entries.filter((entry) => entry.id !== id),
    }
    emit()
    queueCloudReplace(state)
  },
  updateSettings(startWeight: number, targetWeight: number) {
    state = {
      ...state,
      startWeight,
      targetWeight,
    }
    emit()
    queueCloudReplace(state)
  },
  exportState() {
    return JSON.stringify(state, null, 2)
  },
  importState(nextState: AppState) {
    state = normalizeState(nextState)
    emit()
    queueCloudReplace(state)
  },
}
