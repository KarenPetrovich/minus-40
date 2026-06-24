import { useEffect, useRef, useState } from 'react'
import type { AppState, Screen } from '../core/types'
import {
  MILESTONES,
  chartPoints,
  compareEntries,
  currentWeight,
  forecastDaysToMilestone,
  formatDate,
  formatWeight,
  nextMilestone,
  percentToGoal,
  recentTrend,
  remainingToGoal,
  totalLost,
} from '../core/progress'
import { animateValue, fadeIn, fadeOut, lerp, slideIn } from './motion'

type Props = {
  state: AppState
  onAdd: (weight: number) => void
  onDelete: (id: string) => void
  onSettings: (start: number, target: number) => void
}

const icons: Record<Screen, string> = {
  overview: '▦',
  history: '◷',
  graph: '⌃',
  settings: '⚑',
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
        <span className="brand-icon">▣</span>
        <b>Minus 40</b>
        <button className="icon-button" onClick={() => setScreen('settings')}>
          ⚙
        </button>
      </header>
      <main>{children}</main>
      {screen !== 'settings' && (
        <button className="fab" onClick={onAdd}>
          ＋
        </button>
      )}
      <nav>
        {(Object.keys(icons) as Screen[]).map((item) => (
          <button key={item} className={screen === item ? 'active' : ''} onClick={() => setScreen(item)}>
            <i>{icons[item]}</i>
            {{ overview: 'Обзор', history: 'История', graph: 'График', settings: 'Цели' }[item]}
          </button>
        ))}
      </nav>
    </>
  )
}

function Overview({ state, onAdd }: { state: AppState; onAdd: () => void }) {
  const current = currentWeight(state)
  const milestone = nextMilestone(state)
  const trend = recentTrend(state.entries)
  const forecast = forecastDaysToMilestone(state)
  const points = chartPoints(state.entries.slice(0, 7), 300, 92)
  const progress = percentToGoal(state)
  const animatedWeight = useAnimatedWeight(current)
  const progressRef = useRef<HTMLElement>(null)
  const progressFrom = useRef(progress)
  const progressDisplayed = useRef(progress)
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')

  useEffect(() => {
    const element = progressRef.current

    if (!element) return

    const from = progressFrom.current
    progressFrom.current = progress
    progressDisplayed.current = from

    if (from === progress) {
      element.style.width = `${progress.toFixed(2)}%`
      return
    }

    return animateValue({
      from,
      to: progress,
      duration: 280,
      onUpdate: (next) => {
        const smooth = lerp(progressDisplayed.current, next, 0.7)
        progressDisplayed.current = smooth
        element.style.width = `${smooth.toFixed(2)}%`
      },
      onComplete: () => {
        element.style.width = `${progress.toFixed(2)}%`
      },
    })
  }, [progress])

  return (
    <div className="stack">
      <section className="hero-card">
        <label>ТЕКУЩИЙ ВЕС</label>
        <div className="weight">
          {animatedWeight === null ? '—' : animatedWeight.toFixed(1)}
          <small> кг</small>
        </div>
        {trend === null ? (
          <button className="chip" onClick={onAdd}>
            Добавьте замеры
          </button>
        ) : (
          <span className={`chip ${trend > 0 ? 'bad' : ''}`}>
            {trend < 0 ? '↓' : trend > 0 ? '↑' : '→'} {Math.abs(trend * 7).toFixed(1)} кг за неделю
          </span>
        )}
        <div className="progress-head">
          <span>Прогресс до цели</span>
          <b>{progress.toFixed(1)}%</b>
        </div>
        <div className="progress">
          <i ref={progressRef} style={{ width: `${progress.toFixed(2)}%` }} />
        </div>
        <div className="split">
          <span>
            Цель
            <b>{formatWeight(state.targetWeight)}</b>
          </span>
          <span>
            Осталось
            <b>{formatWeight(remainingToGoal(state))}</b>
          </span>
        </div>
      </section>

      <section className="row-card">
        <span>
          ⚑
          <em>
            Следующая цель
            <b>{milestone === null ? 'Цель достигнута' : formatWeight(milestone)}</b>
          </em>
        </span>
        <b>{current === null || milestone === null ? '' : `−${formatWeight(Math.max(current - milestone, 0))}`}</b>
      </section>

      <section className="forecast">
        <span>
          ▣
          <em>
            Прогноз
            <b>{forecast === null ? 'Нужны данные о тренде' : `${forecast} дн. до ${formatWeight(milestone!)}`}</b>
          </em>
        </span>
      </section>

      <section className="chart-card">
        <div className="card-title">
          ⌃ Тренд за 7 дней{' '}
          <b className={trend !== null && trend > 0 ? 'red' : 'orange'}>
            {trend === null ? '—' : `${trend * 7 > 0 ? '+' : ''}${(trend * 7).toFixed(1)} кг`}
          </b>
        </div>
        {points.length ? (
          <svg viewBox="0 0 300 92" preserveAspectRatio="none">
            <polyline points={line} className={trend !== null && trend > 0 ? 'line-red' : 'line-orange'} />
          </svg>
        ) : (
          <p className="empty">График появится после двух замеров.</p>
        )}
      </section>

      <section className="total-card">
        <label>ВСЕГО СБРОШЕНО</label>
        <strong>
          {totalLost(state).toFixed(1)} <small>кг</small>
        </strong>
        <p>С момента начала ({formatWeight(state.startWeight)})</p>
      </section>
    </div>
  )
}

function History({ state, onDelete }: { state: AppState; onDelete: (id: string) => void }) {
  return (
    <div className="history">
      <h1>История веса</h1>
      <p>Все сохранённые замеры</p>
      {state.entries.length === 0 ? (
        <p className="empty">Пока нет замеров.</p>
      ) : (
        state.entries.map((entry, index) => {
          const delta = compareEntries(entry, state.entries[index + 1])

          return (
            <article key={entry.id}>
              <span>
                <b>{formatDate(entry.date, true)}</b>
                <small>{formatDate(entry.date)}</small>
              </span>
              <strong>{formatWeight(entry.weight)}</strong>
              <em className={delta !== null && delta > 0 ? 'red' : 'orange'}>
                {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} кг`}
              </em>
              <button onClick={() => onDelete(entry.id)} aria-label="Удалить">
                ×
              </button>
            </article>
          )
        })
      )}
    </div>
  )
}

function Graph({ state }: { state: AppState }) {
  const points = chartPoints(state.entries)
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const trend = recentTrend(state.entries)

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
            onSave(parsedStart, parsedTarget)
          }
        }}
      >
        Сохранить цели
      </button>
      <h2>Промежуточные цели</h2>
      <div className="milestones">
        {MILESTONES.map((milestone) => (
          <span
            key={milestone}
            className={currentWeight(state) !== null && currentWeight(state)! <= milestone ? 'done' : ''}
          >
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
          <button className="primary" onClick={requestClose}>
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
      <Overview state={state} onAdd={openAdd} />
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
