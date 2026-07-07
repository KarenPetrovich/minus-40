import type { AppState } from '../core/types'
import { currentWeight, formatWeight, milestoneStatus } from '../core/progress'
import { RoadmapNodeBadge } from './RoadmapNodeBadge'

type RoadmapNode = {
  key: string
  x: number
  y: number
  weight: number
  kind: 'start' | 'milestone' | 'finish'
  value: string
  caption: string
  icon: string
}

type RoadmapPath = {
  from: number
  to: number
  d: string
}

const ROADMAP_NODES: readonly RoadmapNode[] = [
  { key: 'start', x: 72, y: 52, weight: 150.5, kind: 'start', value: '150,5', caption: 'СТАРТ', icon: 'flag' },
  { key: '140', x: 228, y: 52, weight: 140, kind: 'milestone', value: '140', caption: '', icon: 'check' },
  { key: '130', x: 72, y: 152, weight: 130, kind: 'milestone', value: '130', caption: '', icon: 'check' },
  { key: '125', x: 110, y: 252, weight: 125, kind: 'milestone', value: '125', caption: '', icon: 'check' },
  { key: '120', x: 228, y: 252, weight: 120, kind: 'milestone', value: '120', caption: '', icon: 'lock' },
  { key: '115', x: 72, y: 352, weight: 115, kind: 'milestone', value: '115', caption: '', icon: 'lock' },
  { key: '110', x: 228, y: 452, weight: 110, kind: 'finish', value: '110', caption: 'ФИНИШ', icon: 'flag' },
]

const ROADMAP_PATHS: readonly RoadmapPath[] = [
  { from: 150.5, to: 140, d: 'M 72 52 L 228 52' },
  { from: 140, to: 130, d: 'M 228 52 C 306 52, 306 152, 228 152 L 72 152' },
  { from: 130, to: 125, d: 'M 72 152 C -6 152, -6 252, 72 252 L 110 252' },
  { from: 125, to: 120, d: 'M 110 252 L 228 252' },
  { from: 120, to: 115, d: 'M 228 252 C 306 252, 306 352, 228 352 L 72 352' },
  { from: 115, to: 110, d: 'M 72 352 C -6 352, -6 452, 72 452 L 228 452' },
]

function iconForNode(kind: 'start' | 'milestone' | 'finish', isReached: boolean) {
  if (kind === 'start') return 'flag'
  if (kind === 'finish') return isReached ? 'flag' : 'lock'
  return isReached ? 'check' : 'lock'
}

type Props = {
  state: AppState
  onSave: (start: number, target: number) => void
}

export function GoalsScreen({ state, onSave }: Props) {
  const current = currentWeight(state)
  const statuses = current !== null
    ? ROADMAP_NODES.map((node) => milestoneStatus(state, node.weight))
    : ROADMAP_NODES.map(() => 'pending' as const)

  return (
    <div className="settings settings-roadmap-screen">
      <h2 className="goals-title">Таков Путь</h2>
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
        <button className="primary settings-edit" onClick={() => onSave(state.startWeight, state.targetWeight)}>
          Изменить
        </button>
      </section>
      <section className="settings-card settings-roadmap">
        <div className="settings-roadmap-frame">
          <svg className="settings-roadmap-path" viewBox="0 0 300 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {ROADMAP_PATHS.map((path) => {
              const isActive = current !== null && current <= path.to

              return (
                <path
                  key={`${path.from}-${path.to}`}
                  d={path.d}
                  fill="none"
                  stroke={isActive ? '#fc820c' : '#ba1a1a'}
                  strokeDasharray={isActive ? undefined : '6 6'}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              )
            })}
          </svg>
          {ROADMAP_NODES.map((node, index) => (
            <div
              key={`${node.key}-label`}
              className={`roadmap-label roadmap-label-${node.kind} ${statuses[index] === 'reached' ? 'is-reached' : 'is-unreached'} ${statuses[index] === 'temporarilyLost' ? 'is-temporarily-lost' : ''} ${node.kind === 'start' ? 'is-start' : ''} ${node.key === '125' ? 'is-compact' : ''}`}
              style={{ left: `${(node.x / 300) * 100}%`, top: `calc(${(node.y / 600) * 100}% - 26px)` }}
            >
              <RoadmapNodeBadge
                kind={node.kind}
                status={statuses[index] === 'reached' ? 'reached' : statuses[index] === 'temporarilyLost' ? 'temporarilyLost' : 'pending'}
                icon={node.kind === 'milestone' && statuses[index] === 'temporarilyLost' ? 'lock' : iconForNode(node.kind, statuses[index] === 'reached')}
              />
              <p
                className={
                  statuses[index] === 'temporarilyLost'
                    ? 'roadmap-label-value roadmap-label-value-error'
                    : statuses[index] === 'reached'
                      ? 'roadmap-label-value roadmap-label-value-secondary'
                      : 'roadmap-label-value roadmap-label-value-error'
                }
              >
                {node.value}
              </p>
              {node.caption ? <p className="roadmap-label-text">{node.caption}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
