import type { AppState } from './types'

const LEGACY_KEY = 'minus40.app-state'
const LEGACY_BACKUP_KEY = 'minus40.app-backup'
const CLOUD_CACHE_KEY = 'minus40.cloud-cache'
const CLOUD_META_KEY = 'minus40.cloud-meta'

export type CloudMeta = {
  cloudMode: boolean
  legacyMigrated: boolean
  lastSyncedAt: number | null
}

export type CloudSnapshot = {
  cache: AppState
  meta: CloudMeta
}

export const DEFAULT_STATE: AppState = {
  startWeight: 150.5,
  targetWeight: 110,
  entries: [
    { id: 'restore-2026-06-27', date: Date.parse('2026-06-27T12:00:00+03:00'), weight: 145.7 },
    { id: 'restore-2026-06-26', date: Date.parse('2026-06-26T12:00:00+03:00'), weight: 146.4 },
    { id: 'restore-2026-06-25', date: Date.parse('2026-06-25T12:00:00+03:00'), weight: 148.2 },
    { id: 'restore-2026-06-24', date: Date.parse('2026-06-24T12:00:00+03:00'), weight: 150.5 },
  ],
}

const DEFAULT_META: CloudMeta = {
  cloudMode: false,
  legacyMigrated: false,
  lastSyncedAt: null,
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)

    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function normalizeState(value: unknown): AppState {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as { entries?: unknown }).entries) ||
    !Number.isFinite((value as { startWeight?: unknown }).startWeight) ||
    !Number.isFinite((value as { targetWeight?: unknown }).targetWeight)
  ) {
    return DEFAULT_STATE
  }

  const normalizedEntries = (value as AppState).entries
    .filter(
      (entry: unknown) =>
        typeof (entry as { id?: unknown })?.id === 'string' &&
        Number.isFinite((entry as { date?: unknown }).date) &&
        Number.isFinite((entry as { weight?: unknown }).weight),
    )
    .sort((left: { date: number }, right: { date: number }) => right.date - left.date)

  const hasJune27 = normalizedEntries.some((entry) => new Date(entry.date).getFullYear() === 2026 && new Date(entry.date).getMonth() === 5 && new Date(entry.date).getDate() === 27)

  return {
    startWeight: (value as AppState).startWeight,
    targetWeight: (value as AppState).targetWeight,
    plateauStartedAt: Number.isFinite((value as { plateauStartedAt?: unknown }).plateauStartedAt)
      ? (value as { plateauStartedAt?: number }).plateauStartedAt ?? null
      : null,
    lastConfirmedMilestone: Number.isFinite((value as { lastConfirmedMilestone?: unknown }).lastConfirmedMilestone)
      ? (value as { lastConfirmedMilestone?: number }).lastConfirmedMilestone ?? null
      : null,
    plateauStartWeight: Number.isFinite((value as { plateauStartWeight?: unknown }).plateauStartWeight)
      ? (value as { plateauStartWeight?: number }).plateauStartWeight ?? null
      : null,
    entries: hasJune27
      ? normalizedEntries
      : [{ id: 'restore-2026-06-27', date: Date.parse('2026-06-27T12:00:00+03:00'), weight: 145.7 }, ...normalizedEntries].sort(
          (left: { date: number }, right: { date: number }) => right.date - left.date,
        ),
  }
}

export function loadLegacyState(): AppState | null {
  const primary = readJson<unknown>(LEGACY_KEY)

  if (primary) return normalizeState(primary)

  const backup = readJson<unknown>(LEGACY_BACKUP_KEY)

  return backup ? normalizeState(backup) : null
}

export function clearLegacyState(): void {
  localStorage.removeItem(LEGACY_KEY)
  localStorage.removeItem(LEGACY_BACKUP_KEY)
}

export function loadCachedState(): AppState | null {
  const cached = readJson<unknown>(CLOUD_CACHE_KEY)

  return cached ? normalizeState(cached) : null
}

export function saveCachedState(state: AppState): void {
  writeJson(CLOUD_CACHE_KEY, normalizeState(state))
}

export function clearCachedState(): void {
  localStorage.removeItem(CLOUD_CACHE_KEY)
}

export function loadCloudMeta(): CloudMeta {
  const meta = readJson<Partial<CloudMeta>>(CLOUD_META_KEY)

  if (!meta || typeof meta !== 'object') {
    return DEFAULT_META
  }

  return {
    cloudMode: Boolean(meta.cloudMode),
    legacyMigrated: Boolean(meta.legacyMigrated),
    lastSyncedAt: Number.isFinite(meta.lastSyncedAt) ? meta.lastSyncedAt ?? null : null,
  }
}

export function saveCloudMeta(meta: Partial<CloudMeta>): CloudMeta {
  const next = {
    ...loadCloudMeta(),
    ...meta,
  }

  writeJson(CLOUD_META_KEY, next)

  return next
}

export function exportCloudSnapshot(): CloudSnapshot {
  return {
    cache: loadCachedState() ?? loadInitialState(),
    meta: loadCloudMeta(),
  }
}

export function importCloudSnapshot(value: unknown): CloudSnapshot {
  const snapshot = typeof value === 'string' ? JSON.parse(value) as CloudSnapshot : value as CloudSnapshot

  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Cloud snapshot is invalid.')
  }

  const cache = normalizeState((snapshot as CloudSnapshot).cache)
  const meta = {
    ...DEFAULT_META,
    ...loadCloudMeta(),
    ...(snapshot as CloudSnapshot).meta,
  }

  saveCachedState(cache)
  writeJson(CLOUD_META_KEY, {
    cloudMode: Boolean(meta.cloudMode),
    legacyMigrated: Boolean(meta.legacyMigrated),
    lastSyncedAt: Number.isFinite(meta.lastSyncedAt) ? meta.lastSyncedAt : null,
  })

  return {
    cache,
    meta: {
      cloudMode: Boolean(meta.cloudMode),
      legacyMigrated: Boolean(meta.legacyMigrated),
      lastSyncedAt: Number.isFinite(meta.lastSyncedAt) ? meta.lastSyncedAt : null,
    },
  }
}

export function loadInitialState(): AppState {
  return loadCachedState() ?? loadLegacyState() ?? DEFAULT_STATE
}
