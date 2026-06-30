import { useState } from 'react'
import type { AppState, Screen } from '../core/types'
import { AppUI } from './AppUI'

type Props = {
  state: AppState
  initialScreen: Screen
  onRefresh: () => void
  onAdd: (weight: number) => void
  onDelete: (id: string) => void
  onSettings: (start: number, target: number) => void
}

export function DeveloperPreviewPage({ state, initialScreen, onRefresh, onAdd, onDelete, onSettings }: Props) {
  const [stageOverride, setStageOverride] = useState<'cut' | 'plateau' | null>(null)
  const [dayOffset, setDayOffset] = useState(0)
  const plateauAnchor = state.plateauStartedAt ?? Date.now()
  const nowOverride = state.plateauStartedAt !== null && state.plateauStartedAt !== undefined
    ? plateauAnchor + dayOffset * 86400000
    : Date.now() + dayOffset * 86400000

  return (
    <div className="developer-preview-shell">
      <div className="developer-preview-controls">
        <button type="button" onClick={onRefresh}>
          Импортировать актуальные данные
        </button>
        <button
          type="button"
          onClick={() => {
            setStageOverride((current) => (current === 'plateau' ? null : 'plateau'))
          }}
        >
          Переключить режим
        </button>
        <button
          type="button"
          onClick={() => {
            setDayOffset((current) => current + 1)
          }}
        >
          +1 день Плато
        </button>
        <button
          type="button"
          onClick={() => {
            setDayOffset(0)
          }}
        >
          Сброс дней Плато
        </button>
      </div>

      <div className="developer-preview-stage">
        <div className="developer-preview-frame" aria-hidden="true" />
        <div className="developer-preview-viewport">
          <AppUI
            state={state}
            onAdd={onAdd}
            onDelete={onDelete}
            onSettings={onSettings}
            initialScreen={initialScreen}
            stageOverride={stageOverride ?? undefined}
            nowOverride={nowOverride}
          />
        </div>
      </div>
    </div>
  )
}
