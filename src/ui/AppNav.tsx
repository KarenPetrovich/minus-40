import type { Screen } from '../core/types'
import { triggerSelection } from '../features/telegram/webapp'

type Props = {
  screen: Screen
  onChange: (screen: Screen) => void
}

function NavIcon({ screen, active }: { screen: Screen; active: boolean }) {
  const primary = '#00328A'
  const inactive = '#8A91A3'
  const strongInactive = '#1A1C1E'
  const orange = '#FC820C'
  const red = '#BA1A1A'

  return (
    <span className={`nav-icon nav-icon-${screen} ${active ? 'is-active' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {screen === 'overview' ? (
          <>
            <rect x="3" y="3" width="7" height="7" stroke={active ? primary : inactive} strokeWidth={active ? '2.5' : '2'} />
            <rect x="14" y="3" width="7" height="7" stroke={red} strokeWidth={active ? '2.5' : '2'} />
            <rect x="14" y="14" width="7" height="7" stroke={active ? primary : inactive} strokeWidth={active ? '2.5' : '2'} />
            <rect x="3" y="14" width="7" height="7" stroke={orange} strokeWidth={active ? '2.5' : '2'} />
          </>
        ) : screen === 'history' ? (
          <>
            <circle cx="12" cy="12" r="10" stroke={active ? primary : '#7A8091'} strokeOpacity={active ? '1' : '0.38'} strokeWidth={active ? '2.5' : '2'} />
            <polyline points="12 6 12 12 16 14" stroke={active ? primary : strongInactive} strokeWidth={active ? '3' : '2.5'} />
          </>
        ) : screen === 'graph' ? (
          <>
            <path d="M3 3v18h18" stroke={active ? primary : inactive} strokeWidth={active ? '2.5' : '2'} />
            <path d="M18 9l-5 5-2-2-4 4" stroke={red} strokeWidth={active ? '3' : '2.5'} />
          </>
        ) : (
          <>
            <path
              d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
              fill={orange}
              stroke={active ? primary : inactive}
              strokeWidth={active ? '2.5' : '2'}
            />
            <line x1="4" y1="22" x2="4" y2="15" stroke={active ? primary : inactive} strokeWidth={active ? '2.5' : '2'} />
          </>
        )}
      </svg>
    </span>
  )
}

export function AppNav({ screen, onChange }: Props) {
  const items: Screen[] = ['overview', 'history', 'graph', 'settings']

  return (
    <nav>
      {items.map((item) => (
        <button
          key={item}
          className={screen === item ? 'active' : ''}
          aria-label={
            {
              overview: 'Обзор',
              history: 'История',
              graph: 'График',
              settings: 'Цели',
            }[item]
          }
          onClick={() => {
            triggerSelection()
            onChange(item)
          }}
        >
          <NavIcon screen={item} active={screen === item} />
          {{ overview: 'Обзор', history: 'История', graph: 'График', settings: 'Цели' }[item]}
        </button>
      ))}
    </nav>
  )
}
