import { useEffect, useSyncExternalStore } from 'react'
import { weightStore } from './core/store'
import { initializeTelegramWebApp, subscribeTelegramEvent } from './features/telegram/webapp'
import { AppUI } from './ui/AppUI'
import { GoalsScreen } from './ui/GoalsScreen'
import { PreviewApp } from './ui/PreviewApp'

export default function App() {
  const state = useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot)
  const isPreview = window.location.pathname === '/preview'
  const isPreviewApp = window.location.pathname === '/preview-app'
  const previewScreenParam = window.location.search
  const previewScreen = new URLSearchParams(previewScreenParam).get('screen')
  const previewScreenValue =
    previewScreen === 'overview' || previewScreen === 'history' || previewScreen === 'graph' || previewScreen === 'settings'
      ? previewScreen
      : 'settings'

  useEffect(() => {
    if (isPreview || isPreviewApp) return

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
  }, [isPreview, isPreviewApp])

  if (isPreview) {
    return (
      <div className="preview-shell">
        <header className="preview-toolbar">
          <div className="preview-brand">
            <span className="preview-title">Stitch</span>
            <span className="preview-beta">BETA</span>
          </div>
          <div className="preview-toolbar-actions" aria-hidden="true">
            <button type="button" className="preview-toolbar-icon" aria-label="mobile">
              <svg viewBox="0 0 24 24">
                <rect x="7" y="3" width="10" height="18" rx="2.5" />
                <path d="M9 6h6" />
              </svg>
            </button>
            <button type="button" className="preview-toolbar-icon" aria-label="desktop">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="5" width="16" height="11" rx="1.5" />
                <path d="M8 20h8" />
                <path d="M12 16v4" />
              </svg>
            </button>
          </div>
        </header>
        <main className="preview-canvas">
          <div className="preview-device">
            <PreviewApp initialScreen={previewScreenValue as 'overview' | 'history' | 'graph' | 'settings'} />
          </div>
        </main>
      </div>
    )
  }

  if (isPreviewApp) {
    const search = new URLSearchParams(window.location.search)
    const screen = search.get('screen')
    const initialScreen = screen === 'history' || screen === 'graph' || screen === 'settings'
      ? (screen as 'history' | 'graph' | 'settings')
      : 'overview'

    if (initialScreen === 'settings') {
      return (
        <GoalsScreen
          state={{
            startWeight: 150.5,
            targetWeight: 110,
            entries: [
              { id: 'p1', date: Date.UTC(2026, 5, 1), weight: 150.5 },
              { id: 'p2', date: Date.UTC(2026, 5, 8), weight: 146.4 },
              { id: 'p3', date: Date.UTC(2026, 5, 15), weight: 140 },
              { id: 'p4', date: Date.UTC(2026, 5, 22), weight: 130 },
            ],
          }}
          onSave={() => {}}
        />
      )
    }

    return <PreviewApp initialScreen={initialScreen} />
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
