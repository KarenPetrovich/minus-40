import type { AppState } from '../core/types'
import { formatWeight } from '../core/progress'

const ROADMAP_NODES = [
  { key: 'start', x: 72, y: 52, kind: 'start', value: '150,5', caption: '\u0421\u0422\u0410\u0420\u0422', tone: 'secondary', icon: 'flag' },
  { key: '140', x: 228, y: 52, kind: 'done', value: '140', caption: '', tone: 'secondary', icon: 'check' },
  { key: '130', x: 72, y: 152, kind: 'current', value: '130', caption: '', tone: 'secondary', icon: 'check' },
  { key: '120', x: 228, y: 252, kind: 'locked', value: '120', caption: '', tone: 'error', icon: 'lock' },
  { key: '115', x: 72, y: 352, kind: 'locked', value: '115', caption: '', tone: 'error', icon: 'lock' },
  { key: '110', x: 228, y: 452, kind: 'finish', value: '110', caption: '\u0424\u0418\u041d\u0418\u0428', tone: 'error', icon: 'flag' },
] as const

type Props = {
  state: AppState
  onSave: (start: number, target: number) => void
}

export function GoalsScreen({ state, onSave }: Props) {
  return (
    <div className="settings settings-roadmap-screen">
      <header className="goals-topbar">
        <div className="goals-topbar-left">
          <span className="material-symbols-outlined goals-topbar-icon" aria-hidden="true">
            close
          </span>
          <h1>{'\u041c\u0438\u043d\u0443\u0441 40'}</h1>
        </div>
        <div className="goals-topbar-right">
          <span className="material-symbols-outlined goals-topbar-icon" aria-hidden="true">
            more_vert
          </span>
        </div>
      </header>
      <h2 className="goals-title">{'\u041f\u0443\u0442\u044c'}</h2>
      <section className="settings-card goals-summary-card">
        <div className="goals-summary-lines" aria-label="Сводка целей">
          <div className="goals-summary-line">
            <span className="goals-summary-dot goals-summary-dot-start" aria-hidden="true" />
            <span className="goals-summary-text">
              <b>Старт:</b> {formatWeight(state.startWeight)}
            </span>
          </div>
          <div className="goals-summary-line">
            <span className="goals-summary-dot goals-summary-dot-target" aria-hidden="true" />
            <span className="goals-summary-text">
              <b>Цель:</b> {formatWeight(state.targetWeight)}
            </span>
          </div>
        </div>
        <button
          className="primary settings-edit"
          onClick={() => onSave(state.startWeight, state.targetWeight)}
        >
          {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
        </button>
      </section>
      <section className="settings-card settings-roadmap">
        <div className="settings-roadmap-frame">
          <svg className="settings-roadmap-path" viewBox="0 0 300 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path d="M 72 52 L 228 52" fill="none" stroke="#fc820c" strokeLinecap="round" strokeWidth="3" />
            <path d="M 228 52 C 306 52, 306 152, 228 152 L 72 152" fill="none" stroke="#fc820c" strokeLinecap="round" strokeWidth="3" />
            <path d="M 72 152 C -6 152, -6 252, 72 252 L 228 252" fill="none" stroke="#ba1a1a" strokeDasharray="6 6" strokeLinecap="round" strokeWidth="3" />
            <path d="M 228 252 C 306 252, 306 352, 228 352 L 72 352" fill="none" stroke="#ba1a1a" strokeDasharray="6 6" strokeLinecap="round" strokeWidth="3" />
            <path d="M 72 352 C -6 352, -6 452, 72 452 L 228 452" fill="none" stroke="#ba1a1a" strokeDasharray="6 6" strokeLinecap="round" strokeWidth="3" />
          </svg>
          {ROADMAP_NODES.map((node) => (
            <div
              key={`${node.key}-label`}
              className={`roadmap-label roadmap-label-${node.kind}`}
              style={{ left: `${(node.x / 300) * 100}%`, top: `${(node.y / 600) * 100}%` }}
            >
              <div className={`roadmap-node ${node.kind}`}>
                <span className="roadmap-node-icon material-symbols-outlined" aria-hidden="true">
                  {node.icon}
                </span>
              </div>
              <p className={node.tone === 'secondary' ? 'roadmap-label-value roadmap-label-value-secondary' : 'roadmap-label-value roadmap-label-value-error'}>{node.value}</p>
              {node.caption ? <p className="roadmap-label-text">{node.caption}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
