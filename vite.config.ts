import { createClient } from '@supabase/supabase-js'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function parseCookies(header: string | undefined): Record<string, string> {
  return (header ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const index = part.indexOf('=')
      if (index === -1) return acc
      const key = part.slice(0, index).trim()
      const value = part.slice(index + 1).trim()
      acc[key] = decodeURIComponent(value)
      return acc
    }, {})
}

type WeightEntry = {
  id: string
  measured_at: string
  weight: number
}

type UserRow = {
  id: string
  start_weight: number
  target_weight: number
  last_seen_at: string | null
  migrated_at: string | null
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devToken = env.DEV_SNAPSHOT_TOKEN?.trim()
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const snapshotEnabled = Boolean(devToken && supabaseUrl && serviceRoleKey)

  return {
    plugins: [
      react(),
      {
        name: 'minus40-dev-snapshot',
        configureServer(server) {
          if (!snapshotEnabled || !supabaseUrl || !serviceRoleKey) {
            return
          }

          const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })

          server.middlewares.use(async (req, res, next) => {
            if (!req.url) {
              next()
              return
            }

            const requestUrl = new URL(req.url, 'http://127.0.0.1:5173')

            if (requestUrl.pathname === '/__dev/cloud-snapshot') {
              const cookies = parseCookies(req.headers.cookie)
              if (cookies.minus40DevToken !== devToken) {
                res.statusCode = 403
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Dev snapshot token is missing or invalid.' }))
                return
              }

              const { data: user, error: userError } = await supabase
                .from('app_users')
                .select('id, start_weight, target_weight, last_seen_at, migrated_at')
                .order('last_seen_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (userError) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: userError.message }))
                return
              }

              if (!user) {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'No Supabase snapshot found.' }))
                return
              }

              const { data: entries, error: entriesError } = await supabase
                .from('weight_entries')
                .select('id, measured_at, weight')
                .eq('user_id', user.id)
                .order('measured_at', { ascending: false })

              if (entriesError) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: entriesError.message }))
                return
              }

              const payload = {
                cache: {
                  startWeight: Number(user.start_weight),
                  targetWeight: Number(user.target_weight),
                  plateauStartedAt: null,
                  lastConfirmedMilestone: null,
                  plateauStartWeight: null,
                  entries: (entries ?? []).map((entry: WeightEntry) => ({
                    id: entry.id,
                    date: new Date(entry.measured_at).getTime(),
                    weight: Number(entry.weight),
                  })),
                },
                meta: {
                  cloudMode: true,
                  legacyMigrated: Boolean((user as UserRow).migrated_at),
                  lastSyncedAt: (user as UserRow).last_seen_at ? new Date((user as UserRow).last_seen_at!).getTime() : null,
                },
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(payload))
              return
            }

            if (requestUrl.pathname === '/' || requestUrl.pathname === '/dev-preview' || requestUrl.pathname === '/preview') {
              res.setHeader(
                'Set-Cookie',
                `minus40DevToken=${encodeURIComponent(devToken)}; Path=/; SameSite=Lax; HttpOnly`,
              )
            }

            next()
          })
        },
      },
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },
  }
})
