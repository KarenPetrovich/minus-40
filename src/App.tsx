import { useEffect, useSyncExternalStore } from 'react'
import { loadCloudMeta, importCloudSnapshot } from './core/storage'
import { weightStore } from './core/store'
import { initializeTelegramWebApp, subscribeTelegramEvent } from './features/telegram/webapp'
import { AppUI } from './ui/AppUI'
import { DeveloperPreviewPage } from './ui/DeveloperPreviewPage'
import './styles/developer-preview.css'

export default function App() {
  const state = useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot)
  const isDevPreview = window.location.pathname === '/dev-preview' || window.location.pathname === '/preview'

  useEffect(() => {
    const root = document.documentElement
    const readyClass = 'material-symbols-ready'
    let active = true

    if (!document.fonts) {
      root.classList.add(readyClass)

      return () => {
        active = false
      }
    }

    if (document.fonts.check('24px "Material Symbols Outlined"')) {
      root.classList.add(readyClass)

      return () => {
        active = false
      }
    }

    void Promise.all([
      document.fonts.load('24px "Material Symbols Outlined"'),
      document.fonts.ready,
    ]).then(() => {
      if (active) {
        root.classList.add(readyClass)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const cleanupTelegram = initializeTelegramWebApp()
    const cleanupActivated = isDevPreview
      ? () => {}
      : subscribeTelegramEvent('activated', () => {
          void weightStore.refresh()
        })
    const intervalId = isDevPreview
      ? null
      : window.setInterval(() => {
          void weightStore.refresh()
        }, 45_000)

    if (!isDevPreview) {
      void weightStore.bootstrap()
    }

    return () => {
      cleanupActivated()
      cleanupTelegram()
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [isDevPreview])

  if (isDevPreview) {
    return (
      <DeveloperPreviewPage
        state={state}
        initialScreen="overview"
        cloudMeta={loadCloudMeta()}
        onRefresh={async () => {
          try {
            const response = await fetch('/__dev/cloud-snapshot', {
              credentials: 'include',
            })

            if (response.ok) {
              const snapshot = await response.json() as Parameters<typeof importCloudSnapshot>[0]
              importCloudSnapshot(snapshot)
              weightStore.rehydrate()

              return {
                source: 'supabase' as const,
                usedLocalCache: false,
              }
            }
          } catch (error) {
            console.error('Dev snapshot refresh failed', error)
          }

          const outcome = await weightStore.refresh()

          if (outcome.source !== 'supabase') {
            weightStore.rehydrate()
          }

          return {
            ...outcome,
            usedLocalCache: outcome.source !== 'supabase' || outcome.usedLocalCache,
          }
        }}
        onAdd={weightStore.addWeight}
        onDelete={weightStore.deleteEntry}
        onSettings={weightStore.updateSettings}
      />
    )
  }

  return (
    <AppUI
      state={state}
      onAdd={weightStore.addWeight}
      onDelete={weightStore.deleteEntry}
      onSettings={weightStore.updateSettings}
    />
  )
}
