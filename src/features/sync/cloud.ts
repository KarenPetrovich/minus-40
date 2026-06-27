import type { AppState } from '../../core/types'
import { normalizeState } from '../../core/storage'
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client'

type BootstrapPayload = {
  action: 'bootstrap'
  initData: string
  legacyState?: AppState | null
}

type ReplacePayload = {
  action: 'replace_state'
  initData: string
  state: AppState
}

type SyncResponse = {
  state: AppState
  meta: {
    source: 'cloud' | 'migrated' | 'seeded'
  }
}

export function canUseCloudSync(): boolean {
  return isSupabaseConfigured && Boolean(supabase)
}

async function invokeTelegramSync(payload: BootstrapPayload | ReplacePayload): Promise<SyncResponse> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.functions.invoke<SyncResponse>('telegram-sync', {
    body: payload,
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Supabase function returned no data.')
  }

  return {
    state: normalizeState(data.state),
    meta: data.meta,
  }
}

export async function bootstrapCloudState(initData: string, legacyState?: AppState | null): Promise<SyncResponse> {
  return invokeTelegramSync({
    action: 'bootstrap',
    initData,
    legacyState: legacyState ? normalizeState(legacyState) : null,
  })
}

export async function replaceCloudState(initData: string, state: AppState): Promise<void> {
  await invokeTelegramSync({
    action: 'replace_state',
    initData,
    state: normalizeState(state),
  })
}
