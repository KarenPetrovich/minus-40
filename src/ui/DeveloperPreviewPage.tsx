import type { AppState, Screen } from '../core/types'
import { AppUI } from './AppUI'

type Props = {
  state: AppState
  initialScreen: Screen
}

export function DeveloperPreviewPage({ state, initialScreen }: Props) {
  return (
    <div className="developer-preview-shell">
      <div className="developer-preview-stage">
        <div className="developer-preview-frame" aria-hidden="true" />
        <div className="developer-preview-viewport">
          <AppUI
            state={state}
            onAdd={() => {}}
            onDelete={() => {}}
            onSettings={() => {}}
            initialScreen={initialScreen}
          />
        </div>
      </div>
    </div>
  )
}
