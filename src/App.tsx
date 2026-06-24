import { useSyncExternalStore } from 'react'
import { weightStore } from './core/store'
import { AppUI } from './ui/AppUI'

export default function App() {
  const state = useSyncExternalStore(weightStore.subscribe, weightStore.getSnapshot, weightStore.getSnapshot)
  return <AppUI state={state} onAdd={weightStore.addWeight} onDelete={weightStore.deleteEntry} onSettings={weightStore.updateSettings} />
}
