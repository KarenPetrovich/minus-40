import { Fragment, useEffect, useRef, useState } from 'react'
import type { AppState, Screen } from '../core/types'
import {
  MILESTONES,
  chartPoints,
  compareEntries,
  currentWeight,
  forecastDaysToMilestone,
  formatDate,
  formatDelta,
  formatMonth,
  formatWeight,
  historyExtremes,
  type HistoryRange,
  nextMilestone,
  percentToMilestone,
  remainingToMilestone,
  totalLost,
  weeklyChange,
} from '../core/progress'
import { triggerImpact, triggerNotification, triggerSelection } from '../features/telegram/webapp'
import { animateValue, fadeIn, fadeOut, lerp, slideIn } from './motion'
import forecastCalendarIcon from '../../forecast-calendar.png'

type Props = {
  state: AppState
  onAdd: (weight: number) => void
  onDelete: (id: string) => void
  onSettings: (start: number, target: number) => void
}

// Temporary placeholder until we pick the final brand sign.
const BRAND_PLACEHOLDER_MARK = '▣'

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

function ScreenTransition({ screen, children }: { screen: Screen; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    return fadeIn(element, 240)
  }, [screen])

  return (
    <div key={screen} ref={ref} className="motion-screen">
      {children}
    </div>
  )
}

function useAnimatedWeight(value: number | null) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    if (value === null) {
      previous.current = null
      setDisplay(null)
      return
    }

    const from = previous.current ?? value
    previous.current = value

    if (from === value) {
      setDisplay(value)
      return
    }

    return animateValue({
      from,
      to: value,
      duration: 280,
      onUpdate: (next) => setDisplay(next),
    })
  }, [value])

  return display
}

function splitWeightParts(value: number | null) {
  if (value === null) {
    return { whole: '—', fraction: '' }
  }

  const [whole, fraction] = value.toFixed(1).split('.')

  return { whole, fraction }
}

function renderForecastText(forecast: { days: number; basis: 'weekly' | 'provisional' } | null, milestone: number | null) {
  if (milestone === null) {
    return <span className="forecast-primary">Цель уже достигнута</span>
  }

  if (forecast === null) {
    return <span className="forecast-primary">Пока рано для прогноза</span>
  }

  return forecast.basis === 'weekly' ? (
    <>
      <span className="forecast-primary">{forecast.days} дн.</span>
      <span className="forecast-secondary">до {formatWeight(milestone)}</span>
    </>
  ) : (
    <>
      <span className="forecast-primary">Предварительно: {forecast.days} дн.</span>
      <span className="forecast-secondary">до {formatWeight(milestone)}</span>
    </>
  )
}

function DialogFrame({
  className = '',
  onClose,
  children,
}: {
  className?: string
  onClose: () => void
  children: (requestClose: () => void) => React.ReactNode
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current

    if (!overlay || !panel) return

    const stopOverlay = fadeIn(overlay, 200)
    const stopPanel = slideIn(panel, 'up', 260)

    return () => {
      stopOverlay()
      stopPanel()
    }
  }, [])

  const requestClose = () => {
    if (closing) return

    const overlay = overlayRef.current
    const panel = panelRef.current

    setClosing(true)
    if (overlay) fadeOut(overlay, 180)
    if (panel) fadeOut(panel, 180)
    window.setTimeout(onClose, 180)
  }

  return (
    <div ref={overlayRef} className={`dialog ${className}`.trim()}>
      <section ref={panelRef}>{children(requestClose)}</section>
    </div>
  )
}

function Layout({
  screen,
  setScreen,
  children,
  onAdd,
}: {
  screen: Screen
  setScreen: (value: Screen) => void
  children: React.ReactNode
  onAdd: () => void
}) {
  return (
    <>
      <header>
        <img className="brand-mark brand-logo" src="/brand-logo.png" alt="Логотип Минус 40" data-brand-mark={BRAND_PLACEHOLDER_MARK} />
      </header>
      <main>{children}</main>
      {screen === 'overview' && (
        <button
          className="fab"
          onClick={() => {
            triggerImpact('medium')
            onAdd()
          }}
          aria-label="Добавить замер"
        >
          ＋
        </button>
      )}
      <nav>
        {(['overview', 'history', 'graph', 'settings'] as Screen[]).map((item) => (
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
              setScreen(item)
            }}
          >
            <NavIcon screen={item} active={screen === item} />
            {{ overview: 'Обзор', history: 'История', graph: 'График', settings: 'Цели' }[item]}
          </button>
        ))}
      </nav>
    </>
  )
}

function Overview({ state }: { state: AppState }) {
  const current = currentWeight(state)
  const milestone = nextMilestone(state)
  const forecast = forecastDaysToMilestone(state)
  const milestoneProgress = percentToMilestone(state)
  const milestoneRemaining = remainingToMilestone(state)
  const animatedWeight = useAnimatedWeight(current)
  const weightParts = splitWeightParts(animatedWeight)
  const progressRef = useRef<HTMLElement>(null)
  const progressFrom = useRef(milestoneProgress)
  const progressDisplayed = useRef(milestoneProgress)
  const lostTotal = totalLost(state)
  const isAboveStart = lostTotal < 0

  useEffect(() => {
    const element = progressRef.current

    if (!element) return

    const from = progressFrom.current
    progressFrom.current = milestoneProgress
    progressDisplayed.current = from

    if (from === milestoneProgress) {
      element.style.width = `${milestoneProgress.toFixed(2)}%`
      return
    }

    return animateValue({
      from,
      to: milestoneProgress,
      duration: 280,
      onUpdate: (next) => {
        const smooth = lerp(progressDisplayed.current, next, 0.7)
        progressDisplayed.current = smooth
        element.style.width = `${smooth.toFixed(2)}%`
      },
      onComplete: () => {
        element.style.width = `${milestoneProgress.toFixed(2)}%`
      },
    })
  }, [milestoneProgress])

  return (
    <div className="stack">
      <section className="hero-card">
        <label>ТЕКУЩИЙ ВЕС</label>
        <div className="weight" aria-label={animatedWeight === null ? 'нет веса' : `${animatedWeight.toFixed(1)} кг`}>
          <span className="weight-whole">{weightParts.whole}</span>
          {weightParts.fraction ? (
            <>
              <span className="weight-separator">.</span>
              <span className="weight-fraction">{weightParts.fraction}</span>
            </>
          ) : null}
          <small> кг</small>
        </div>
        <div className="progress-head">
          <span>{milestone === null ? 'Промежуточные цели закрыты' : `До следующей цели ${formatWeight(milestone)}`}</span>
          <b>{milestone === null ? '100%' : `${milestoneProgress.toFixed(1)}%`}</b>
        </div>
        <div className="progress">
          <i ref={progressRef} style={{ width: `${milestoneProgress.toFixed(2)}%` }} />
        </div>
        <div className="milestone-footer">
          <span>Осталось</span>
          <b>{milestoneRemaining === null ? '0,0 кг' : formatWeight(milestoneRemaining)}</b>
        </div>
      </section>

      <section className="forecast">
        <span>
          <span className="placeholder-mark" aria-hidden="true">
            <img className="forecast-icon" src={forecastCalendarIcon} alt="" />
          </span>
          <em>
            Прогноз
            <b>{renderForecastText(forecast, milestone)}</b>
          </em>
        </span>
      </section>

      <section className="total-card">
        <label>{isAboveStart ? 'ИЗМЕНЕНИЕ ОТ СТАРТА' : 'ВСЕГО СБРОШЕНО'}</label>
        <strong>
          {(isAboveStart ? Math.abs(lostTotal) : lostTotal).toFixed(1)} <small>кг</small>
        </strong>
        <p>{isAboveStart ? `Выше стартового веса ${formatWeight(state.startWeight)}` : `С момента начала ${formatWeight(state.startWeight)}`}</p>
      </section>
    </div>
  )
}

function History({ state, onDelete }: { state: AppState; onDelete: (id: string) => void }) {
  const [range, setRange] = useState<HistoryRange>('week')
  const [filter, setFilter] = useState<'all' | 'loss' | 'gain'>('all')
  const extremes = historyExtremes(state.entries, range)
  const visibleEntries = state.entries.filter((entry, index) => {
    if (filter === 'all') return true

    const delta = compareEntries(entry, state.entries[index + 1])

    if (delta === null) return false

    return filter === 'loss' ? delta < 0 : delta > 0
  })
  const visibleRows = visibleEntries.map((entry) => {
    const originalIndex = state.entries.findIndex((item) => item.id === entry.id)
    const delta = compareEntries(entry, state.entries[originalIndex + 1])

    return { entry, delta }
  })

  return (
    <div className="history">
      <h1>{'\u0417\u0430\u043c\u0435\u0440\u044b \u0432\u0435\u0441\u0430'}</h1>
      <section className="history-summary" aria-label={'\u0421\u0432\u043e\u0434\u043a\u0430 \u043f\u043e \u0437\u0430\u043c\u0435\u0440\u0430\u043c'}>
        <div className="history-range-switch" role="tablist" aria-label={'\u041f\u0435\u0440\u0438\u043e\u0434 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0438'}>
          {([
            ['week', '\u041d\u0435\u0434\u0435\u043b\u044f'],
            ['month', '\u041c\u0435\u0441\u044f\u0446'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={range === value ? 'active' : ''}
              onClick={() => setRange(value)}
              aria-pressed={range === value}
            >
              {label}
            </button>
          ))}
        </div>
        <article>
          <small className="history-summary-label">{'\u0420\u0435\u043a\u043e\u0440\u0434'}</small>
          <strong className="metric-good">
            {extremes.best === null ? (
              '\u2014'
            ) : (
              <>
                <span className="history-summary-value">{extremes.best > 0 ? '+' : ''}{extremes.best.toFixed(1).replace('.', ',')}</span>
                <small>{'\u043a\u0433'}</small>
              </>
            )}
          </strong>
        </article>
        <article>
          <small className="history-summary-label">{'\u041f\u0440\u043e\u0432\u0430\u043b'}</small>
          <strong className="metric-bad">
            {extremes.worst === null ? (
              '\u2014'
            ) : (
              <>
                <span className="history-summary-value">{extremes.worst > 0 ? '+' : ''}{extremes.worst.toFixed(1).replace('.', ',')}</span>
                <small>{'\u043a\u0433'}</small>
              </>
            )}
          </strong>
        </article>
      </section>
      <div className="history-filter" role="tablist" aria-label={'\u0424\u0438\u043b\u044c\u0442\u0440 \u0437\u0430\u043c\u0435\u0440\u043e\u0432'}>
        {([
          ['all', '\u0412\u0441\u0435'],
          ['loss', '\u0421\u043d\u0438\u0436\u0435\u043d\u0438\u0435'],
          ['gain', '\u041d\u0430\u0431\u043e\u0440'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'active' : ''}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
          >
            {label}
          </button>
        ))}
      </div>
      {state.entries.length === 0 ? (
        <p className="empty">{'\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0437\u0430\u043c\u0435\u0440\u043e\u0432.'}</p>
      ) : visibleEntries.length === 0 ? (
        <p className="empty">{'\u0414\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0444\u0438\u043b\u044c\u0442\u0440\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0437\u0430\u043c\u0435\u0440\u043e\u0432.'}</p>
      ) : (
        visibleRows.map(({ entry, delta }, index) => {
          const trendClass = delta === null ? 'is-neutral' : delta > 0 ? 'is-gain' : delta < 0 ? 'is-loss' : 'is-neutral'
          const trendLabel =
            delta === null
              ? '\u0421\u0442\u0430\u0440\u0442'
              : delta > 0
                ? '\u041d\u0430\u0431\u043e\u0440'
                : delta < 0
                  ? '\u0421\u043d\u0438\u0436\u0435\u043d\u0438\u0435'
                  : '\u0411\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439'

          return (
            <Fragment key={entry.id}>
              {(index === 0 || formatMonth(visibleRows[index - 1].entry.date) !== formatMonth(entry.date)) && (
                <div className="history-month">{formatMonth(entry.date)}</div>
              )}
              <article>
                <span className="history-date">
                  <b>{formatDate(entry.date, true)}</b>
                </span>
                <strong>{formatWeight(entry.weight)}</strong>
                <em className={`history-delta ${trendClass}`} aria-label={trendLabel}>
                  <span>{delta === null ? '\u0421\u0442\u0430\u0440\u0442' : formatDelta(delta)}</span>
                </em>
                <button
                  onClick={() => {
                    triggerImpact('medium')
                    onDelete(entry.id)
                  }}
                  aria-label={'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
                >
                  {'\u00D7'}
                </button>
              </article>
            </Fragment>
          )
        })
      )}
    </div>
  )
}

function Graph({ state }: { state: AppState }) {
  const points = chartPoints(state.entries)
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const trend = weeklyChange(state.entries)

  return (
    <div className="graph">
      <h1>График веса</h1>
      <p>Динамика всех замеров</p>
      <section className="big-chart">
        {points.length > 1 ? (
          <svg viewBox="0 0 300 150" preserveAspectRatio="none">
            <line x1="0" x2="300" y1="30" y2="30" />
            <line x1="0" x2="300" y1="75" y2="75" />
            <line x1="0" x2="300" y1="120" y2="120" />
            <polyline points={line} className={trend !== null && trend > 0 ? 'line-red' : 'line-orange'} />
            {points.map((point) => (
              <circle key={point.date} cx={point.x} cy={point.y} r="3" />
            ))}
          </svg>
        ) : (
          <p className="empty">Для графика добавьте минимум два замера.</p>
        )}
      </section>
      <section className="legend">
        <span className="orange">● Снижение веса</span>
        <span className="red">● Набор веса</span>
      </section>
    </div>
  )
}

function Settings({ state, onSave }: { state: AppState; onSave: (start: number, target: number) => void }) {
  const [start, setStart] = useState(String(state.startWeight))
  const [target, setTarget] = useState(String(state.targetWeight))

  return (
    <div className="settings">
      <h1>Цели и ориентиры</h1>
      <section>
        <label>СТАРТОВЫЙ ВЕС</label>
        <input value={start} inputMode="decimal" onChange={(event) => setStart(event.target.value)} />
        <span>кг</span>
      </section>
      <section>
        <label>ЦЕЛЕВОЙ ВЕС</label>
        <input value={target} inputMode="decimal" onChange={(event) => setTarget(event.target.value)} />
        <span>кг</span>
      </section>
      <button
        className="primary"
        onClick={() => {
          const parsedStart = Number(start.replace(',', '.'))
          const parsedTarget = Number(target.replace(',', '.'))

          if (parsedStart > 0 && parsedTarget > 0 && parsedTarget < parsedStart) {
            triggerNotification('success')
            onSave(parsedStart, parsedTarget)
          }
        }}
      >
        Сохранить цели
      </button>
      <h2>Промежуточные цели</h2>
      <div className="milestones">
        {MILESTONES.map((milestone) => (
          <span key={milestone} className={currentWeight(state) !== null && currentWeight(state)! <= milestone ? 'done' : ''}>
            {milestone} кг
          </span>
        ))}
      </div>
    </div>
  )
}

function AddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (value: number) => void }) {
  const [value, setValue] = useState('')
  const parsed = Number(value.replace(',', '.'))

  const save = (requestClose: () => void) => {
    if (Number.isFinite(parsed) && parsed > 0) {
      triggerNotification('success')
      onAdd(parsed)
      requestClose()
    }
  }

  return (
    <DialogFrame onClose={onClose}>
      {(requestClose) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            save(requestClose)
          }}
        >
          <button className="close" type="button" onClick={requestClose}>
            ×
          </button>
          <label>НОВЫЙ ЗАМЕР</label>
          <input
            autoFocus
            type="text"
            enterKeyHint="done"
            placeholder="0,0"
            inputMode="decimal"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <small>кг</small>
          <button className="primary" type="submit" disabled={!Number.isFinite(parsed) || parsed <= 0}>
            Сохранить
          </button>
        </form>
      )}
    </DialogFrame>
  )
}

function MilestoneDialog({ value, onClose }: { value: number; onClose: () => void }) {
  return (
    <DialogFrame className="milestone-dialog" onClose={onClose}>
      {(requestClose) => (
        <>
          <b>★</b>
          <label>РУБЕЖ ДОСТИГНУТ</label>
          <h1>{formatWeight(value)}</h1>
          <p>Отличная работа. Продолжайте в том же ритме.</p>
          <button
            className="primary"
            onClick={() => {
              triggerImpact('light')
              requestClose()
            }}
          >
            Продолжить
          </button>
        </>
      )}
    </DialogFrame>
  )
}

export function AppUI({ state, onAdd, onDelete, onSettings }: Props) {
  const [screen, setScreen] = useState<Screen>('overview')
  const [adding, setAdding] = useState(false)
  const [reached, setReached] = useState<number | null>(null)

  const add = (weight: number) => {
    const before = nextMilestone(state)
    onAdd(weight)

    if (before !== null && weight <= before) setReached(before)
  }

  const openAdd = () => setAdding(true)

  const view =
    screen === 'overview' ? (
      <Overview state={state} />
    ) : screen === 'history' ? (
      <History state={state} onDelete={onDelete} />
    ) : screen === 'graph' ? (
      <Graph state={state} />
    ) : (
      <Settings state={state} onSave={onSettings} />
    )

  return (
    <Layout screen={screen} setScreen={setScreen} onAdd={openAdd}>
      <ScreenTransition screen={screen}>{view}</ScreenTransition>
      {adding && <AddDialog onClose={() => setAdding(false)} onAdd={add} />}
      {reached !== null && <MilestoneDialog value={reached} onClose={() => setReached(null)} />}
    </Layout>
  )
}
