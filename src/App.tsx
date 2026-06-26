import { useEffect, useSyncExternalStore } from 'react'
import { weightStore } from './core/store'
import { initializeTelegramWebApp } from './features/telegram/webapp'
import { AppUI } from './ui/AppUI'

export default function App() {
  const state = useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot)

  useEffect(() => initializeTelegramWebApp(), [])

  return (
    <AppUI
      state={state}
      onAdd={weightStore.addWeight}
      onDelete={weightStore.deleteEntry}
      onSettings={weightStore.updateSettings}
    />
  )
}
