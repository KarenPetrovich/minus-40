import { createClient } from 'npm:@supabase/supabase-js@2'

type WeightEntry = {
  id: string
  date: number
  weight: number
}

type AppState = {
  startWeight: number
  targetWeight: number
  entries: WeightEntry[]
  plateauStartedAt?: number | null
  lastConfirmedMilestone?: number | null
  plateauStartWeight?: number | null
}

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

type Payload = BootstrapPayload | ReplacePayload

type TelegramUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

type TelegramInitDataPayload = {
  authDate: number
  user: TelegramUser
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const DEFAULT_SETTINGS = {
  startWeight: 150.5,
  targetWeight: 110,
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}

function normalizeState(value: AppState): AppState {
  return {
    startWeight: Number(value.startWeight),
    targetWeight: Number(value.targetWeight),
    plateauStartedAt: Number.isFinite(value.plateauStartedAt) ? Number(value.plateauStartedAt) : null,
    lastConfirmedMilestone: Number.isFinite(value.lastConfirmedMilestone) ? Number(value.lastConfirmedMilestone) : null,
    plateauStartWeight: Number.isFinite(value.plateauStartWeight) ? Number(value.plateauStartWeight) : null,
    entries: [...value.entries]
      .filter((entry) => typeof entry.id === 'string' && Number.isFinite(entry.date) && Number.isFinite(entry.weight))
      .sort((left, right) => right.date - left.date)
      .map((entry) => ({
        id: entry.id,
        date: Number(entry.date),
        weight: Number(entry.weight),
      })),
  }
}

function isValidState(value: unknown): value is AppState {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Number.isFinite((value as AppState).startWeight) &&
    Number.isFinite((value as AppState).targetWeight) &&
    Array.isArray((value as AppState).entries),
  )
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256(key: Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
}

async function validateTelegramInitData(initData: string, botToken: string): Promise<TelegramInitDataPayload> {
  if (!initData) {
    throw new Error('Missing Telegram initData.')
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash) {
    throw new Error('Missing Telegram hash.')
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secret = await hmacSha256(new TextEncoder().encode('WebAppData'), botToken)
  const signature = await hmacSha256(new Uint8Array(secret), dataCheckString)

  if (toHex(signature) !== hash) {
    throw new Error('Telegram initData signature is invalid.')
  }

  const authDateRaw = params.get('auth_date')

  if (!authDateRaw || !Number.isFinite(Number(authDateRaw))) {
    throw new Error('Telegram auth_date is missing or invalid.')
  }

  const authDate = Number(authDateRaw)
  const now = Math.floor(Date.now() / 1000)
  const maxAgeSeconds = 60 * 60

  if (authDate > now + 60) {
    throw new Error('Telegram auth_date is in the future.')
  }

  if (now - authDate > maxAgeSeconds) {
    throw new Error('Telegram initData is too old.')
  }

  const userRaw = params.get('user')

  if (!userRaw) {
    throw new Error('Telegram user payload is missing.')
  }

  const user = JSON.parse(userRaw) as TelegramUser

  if (!Number.isFinite(user.id)) {
    throw new Error('Telegram user id is invalid.')
  }

  return {
    authDate,
    user,
  }
}

function mapDbState(user: {
  start_weight: number
  target_weight: number
  plateau_started_at: number | null
  last_confirmed_milestone: number | null
  plateau_start_weight: number | null
}, entries: Array<{
  id: string
  measured_at: string
  weight: number
}>): AppState {
  return {
    startWeight: Number(user.start_weight),
    targetWeight: Number(user.target_weight),
    plateauStartedAt: Number.isFinite(user.plateau_started_at) ? Number(user.plateau_started_at) : null,
    lastConfirmedMilestone: Number.isFinite(user.last_confirmed_milestone) ? Number(user.last_confirmed_milestone) : null,
    plateauStartWeight: Number.isFinite(user.plateau_start_weight) ? Number(user.plateau_start_weight) : null,
    entries: entries
      .map((entry) => ({
        id: entry.id,
        date: new Date(entry.measured_at).getTime(),
        weight: Number(entry.weight),
      }))
      .sort((left, right) => right.date - left.date),
  }
}

async function replaceEntries(
  db: ReturnType<typeof createClient>,
  userId: string,
  entries: WeightEntry[],
  source: 'manual' | 'migration',
): Promise<void> {
  const { error } = await db.rpc('replace_user_state', {
    p_user_id: userId,
    p_entries: entries.map((entry) => ({
      id: entry.id,
      measured_at: new Date(entry.date).toISOString(),
      weight: entry.weight,
      source,
    })),
  })

  if (error) {
    throw error
  }
}

async function loadCloudState(
  db: ReturnType<typeof createClient>,
  telegramUserId: number,
): Promise<{ user: { id: string; start_weight: number; target_weight: number; migrated_at: string | null } | null; state: AppState | null }> {
  const { data: user, error: userError } = await db
    .from('app_users')
    .select('id, start_weight, target_weight, migrated_at')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()

  if (userError) {
    throw userError
  }

  if (!user) {
    return { user: null, state: null }
  }

  const { data: entries, error: entriesError } = await db
    .from('weight_entries')
    .select('id, measured_at, weight')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })

  if (entriesError) {
    throw entriesError
  }

  return {
    user,
    state: mapDbState(user, entries ?? []),
  }
}

async function upsertUserProfile(
  db: ReturnType<typeof createClient>,
  telegramUser: TelegramUser,
  state: AppState,
  markMigrated: boolean,
): Promise<{
  id: string
  start_weight: number
  target_weight: number
  plateau_started_at: number | null
  last_confirmed_milestone: number | null
  plateau_start_weight: number | null
  migrated_at: string | null
}> {
  const payload = {
    telegram_user_id: telegramUser.id,
    telegram_username: telegramUser.username ?? null,
    telegram_first_name: telegramUser.first_name ?? null,
    telegram_last_name: telegramUser.last_name ?? null,
    start_weight: state.startWeight,
    target_weight: state.targetWeight,
    plateau_started_at: state.plateauStartedAt ?? null,
    last_confirmed_milestone: state.lastConfirmedMilestone ?? null,
    plateau_start_weight: state.plateauStartWeight ?? null,
    last_seen_at: new Date().toISOString(),
  }

  const { data, error } = await db
    .from('app_users')
    .upsert({
      ...payload,
      ...(markMigrated ? { migrated_at: new Date().toISOString() } : {}),
    }, {
      onConflict: 'telegram_user_id',
    })
    .select('id, start_weight, target_weight, plateau_started_at, last_confirmed_milestone, plateau_start_weight, migrated_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

async function handleBootstrap(
  db: ReturnType<typeof createClient>,
  telegramUser: TelegramUser,
  legacyState: AppState | null | undefined,
): Promise<{ state: AppState; meta: { source: 'cloud' | 'migrated' | 'seeded' } }> {
  const normalizedLegacy = legacyState && isValidState(legacyState) ? normalizeState(legacyState) : null
  const current = await loadCloudState(db, telegramUser.id)

  if (current.user && current.state && current.state.entries.length > 0) {
    await db
      .from('app_users')
      .update({
        telegram_username: telegramUser.username ?? null,
        telegram_first_name: telegramUser.first_name ?? null,
        telegram_last_name: telegramUser.last_name ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', current.user.id)

    return {
      state: current.state,
      meta: { source: 'cloud' },
    }
  }

  if (normalizedLegacy) {
    const user = await upsertUserProfile(db, telegramUser, normalizedLegacy, true)
    await replaceEntries(db, user.id, normalizedLegacy.entries, 'migration')

    return {
      state: normalizedLegacy,
      meta: { source: 'migrated' },
    }
  }

  if (current.user && current.state) {
    return {
      state: current.state,
      meta: { source: 'cloud' },
    }
  }

  const seededState: AppState = {
    ...DEFAULT_SETTINGS,
    entries: [],
    plateauStartedAt: null,
    lastConfirmedMilestone: null,
    plateauStartWeight: null,
  }

  const user = await upsertUserProfile(db, telegramUser, seededState, false)
  await replaceEntries(db, user.id, [], 'manual')

  return {
    state: seededState,
    meta: { source: 'seeded' },
  }
}

async function handleReplaceState(
  db: ReturnType<typeof createClient>,
  telegramUser: TelegramUser,
  nextState: AppState,
): Promise<{ state: AppState; meta: { source: 'cloud' } }> {
  if (!isValidState(nextState)) {
    throw new Error('State payload is invalid.')
  }

  const normalizedState = normalizeState(nextState)
  const user = await upsertUserProfile(db, telegramUser, normalizedState, false)
  await replaceEntries(db, user.id, normalizedState.entries, 'manual')

  return {
    state: normalizedState,
    meta: { source: 'cloud' },
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!supabaseUrl || !serviceRoleKey || !botToken) {
      throw new Error('Supabase function secrets are not configured.')
    }

    const payload = await request.json() as Payload

    if (!payload || typeof payload !== 'object' || !('action' in payload) || typeof payload.action !== 'string') {
      throw new Error('Payload action is missing.')
    }

    const telegramAuth = await validateTelegramInitData(payload.initData, botToken)
    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    if (payload.action === 'bootstrap') {
      return json(await handleBootstrap(db, telegramAuth.user, payload.legacyState))
    }

    if (payload.action === 'replace_state') {
      return json(await handleReplaceState(db, telegramAuth.user, payload.state))
    }

    return json({ error: 'Unsupported action.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return json({ error: message }, 400)
  }
})
