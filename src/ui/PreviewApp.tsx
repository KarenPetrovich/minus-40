import type { AppState, Screen } from '../core/types'
import { AppUI } from './AppUI'

type Props = {
  initialScreen?: Screen
}

const previewState: AppState = {
  startWeight: 150.5,
  targetWeight: 110,
  entries: [
    { id: 'p0', date: Date.UTC(2026, 5, 27), weight: 145.7 },
    { id: 'p1', date: Date.UTC(2026, 5, 1), weight: 150.5 },
    { id: 'p2', date: Date.UTC(2026, 5, 8), weight: 146.4 },
    { id: 'p3', date: Date.UTC(2026, 5, 15), weight: 140 },
    { id: 'p4', date: Date.UTC(2026, 5, 22), weight: 130 },
  ],
}

export function PreviewApp({ initialScreen = 'settings' }: Props) {
  return (
    <AppUI
      state={previewState}
      onAdd={() => {}}
      onDelete={() => {}}
      onSettings={() => {}}
      initialScreen={initialScreen}
    />
  )
}
