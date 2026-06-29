import { useEffect, useSyncExternalStore } from 'react'
import { weightStore } from './core/store'
import { initializeTelegramWebApp, subscribeTelegramEvent } from './features/telegram/webapp'
import { AppUI } from './ui/AppUI'
import { DeveloperPreviewPage } from './ui/DeveloperPreviewPage'
import { RuntimeInspectorPage } from './ui/RuntimeInspectorPage'
import './styles/developer-preview.css'
import './styles/runtime-inspector.css'

export default function App() {
  const state = useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot)
  const isDevPreview = window.location.pathname === '/dev-preview' || window.location.pathname === '/preview'
  const isRuntimeInspector = window.location.pathname === '/runtime-inspector'
  const previewScreen = new URLSearchParams(window.location.search).get('screen')
  const previewScreenValue =
    previewScreen === 'overview' || previewScreen === 'history' || previewScreen === 'graph' || previewScreen === 'settings'
      ? previewScreen
      : 'settings'

  useEffect(() => {
    if (isDevPreview) return

    const cleanupTelegram = initializeTelegramWebApp()
    const cleanupActivated = subscribeTelegramEvent('activated', () => {
      void weightStore.refresh()
    })
    const intervalId = window.setInterval(() => {
      void weightStore.refresh()
    }, 45_000)

    void weightStore.bootstrap()

    return () => {
      cleanupActivated()
      cleanupTelegram()
      window.clearInterval(intervalId)
    }
  }, [isDevPreview])

  if (isDevPreview) {
    return (
      <DeveloperPreviewPage
        state={{
          startWeight: 150.5,
          targetWeight: 110,
          entries: [
            { id: 'p0', date: Date.UTC(2026, 5, 27), weight: 145.7 },
            { id: 'p1', date: Date.UTC(2026, 5, 1), weight: 150.5 },
            { id: 'p2', date: Date.UTC(2026, 5, 8), weight: 146.4 },
            { id: 'p3', date: Date.UTC(2026, 5, 15), weight: 140 },
            { id: 'p4', date: Date.UTC(2026, 5, 22), weight: 130 },
          ],
        }}
        initialScreen={previewScreenValue as 'overview' | 'history' | 'graph' | 'settings'}
      />
    )
  }

  if (isRuntimeInspector) {
    return <RuntimeInspectorPage />
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
