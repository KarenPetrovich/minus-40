import { useEffect, useSyncExternalStore } from 'react'
import { weightStore } from './core/store'
import { initializeTelegramWebApp, subscribeTelegramEvent } from './features/telegram/webapp'
import { AppUI } from './ui/AppUI'
import { DeveloperPreviewPage } from './ui/DeveloperPreviewPage'
import './styles/developer-preview.css'

export default function App() {
  const state = useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot)
  const isDevPreview = window.location.pathname === '/dev-preview' || window.location.pathname === '/preview'

  useEffect(() => {
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
        state={state}
        initialScreen="overview"
        onRefresh={() => {
          weightStore.rehydrate()
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
