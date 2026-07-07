import { Fragment, useEffect, useRef, useState } from 'react'
import type { AppState, CommentTargetType, Screen } from '../core/types'
import {
  averagePeriodChange,
  clamp,
  daysInJourney,
  chartPoints,
  compareEntries,
  currentWeight,
  filterEntriesByRange,
  forecastDaysToMilestone,
  type ChartRange,
  formatDate,
  formatDelta,
  formatMonth,
  formatWeight,
  historyExtremes,
  type HistoryRange,
  nextMilestone,
  percentToMilestone,
  remainingToMilestone,
  longestLossStreak,
  monthlyCalendarChange,
  currentStage,
  plateauBounds,
  plateauFillCount,
  totalLost,
} from '../core/progress'
import { triggerImpact, triggerNotification } from '../features/telegram/webapp'
import { animateValue, fadeIn, fadeOut, lerp, slideIn } from './motion'
import { AppNav } from './AppNav'
import { GoalsScreen } from './GoalsScreen'
import { RoadmapNodeBadge } from './RoadmapNodeBadge'
import forecastCalendarIcon from '../../forecast-calendar.png'

type Props = {
  state: AppState
  onAdd: (weight: number) => void
  onDelete: (id: string) => void
  onSettings: (start: number, target: number) => void
  onGetComment: (targetType: CommentTargetType, targetKey: string) => { id: string; text: string } | null
  onUpsertComment: (targetType: CommentTargetType, targetKey: string, text: string) => void
  onDeleteComment: (targetType: CommentTargetType, targetKey: string) => void
  initialScreen?: Screen
  stageOverride?: 'cut' | 'plateau'
  nowOverride?: number
}

// Temporary placeholder until we pick the final brand sign.
const BRAND_PLACEHOLDER_MARK = '?'

const pluralizeDays = (value: number) => {
  const mod10 = value % 10
  const mod100 = value % 100

  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'

  return 'дней'
}

const pluralizeMonths = (value: number) => {
  const mod10 = value % 10
  const mod100 = value % 100

  if (mod10 === 1 && mod100 !== 11) return 'месяц'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'месяца'

  return 'месяцев'
}

function formatJourneyDuration(days: number | null) {
  if (days === null) {
    return '—'
  }

  if (days < 30) {
    return `${days} ${pluralizeDays(days)}`
  }

  const months = days / 30
  const roundedMonths = Math.round(months)

  if (Math.abs(months - roundedMonths) < 0.05) {
    return `${roundedMonths} ${pluralizeMonths(roundedMonths)}`
  }

  const formattedMonths = months.toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return `${formattedMonths} месяца`
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

  return (
    <span className="forecast-line">
      <span className="forecast-primary">{forecast.days} {pluralizeDays(forecast.days)}</span>
      <span className="forecast-secondary">до {formatWeight(milestone)}</span>
    </span>
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

type CommentTarget = {
  type: 'milestone' | 'weight_entry'
  key: string
  title: string
  subtitle: string
}

function CommentDialog({
  target,
  initialText,
  onClose,
  onSave,
  onDelete,
}: {
  target: CommentTarget
  initialText: string
  onClose: () => void
  onSave: (text: string) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(initialText)

  useEffect(() => {
    setValue(initialText)
  }, [initialText, target.key, target.type])

  const trimmed = value.trim()

  return (
    <DialogFrame className="comment-dialog" onClose={onClose}>
      {(requestClose) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()

            if (trimmed) {
              onSave(trimmed)
            } else {
              onDelete()
            }

            requestClose()
          }}
        >
          <button className="close" type="button" onClick={requestClose} aria-label="Закрыть">
            ×
          </button>
          <label>КОММЕНТАРИЙ</label>
          <h1>{target.title}</h1>
          <p className="comment-dialog-subtitle">{target.subtitle}</p>
          <textarea
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Добавьте комментарий..."
          />
          <div className="comment-dialog-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => {
                onDelete()
                requestClose()
              }}
              disabled={!trimmed && initialText.trim().length === 0}
            >
              Удалить
            </button>
            <button className="primary" type="submit">
              Сохранить
            </button>
          </div>
        </form>
      )}
    </DialogFrame>
  )
}

function Layout({
  screen,
  setScreen,
  children,
  onAdd,
  shellVariant = 'default',
  headerTitle = '',
}: {
  screen: Screen
  setScreen: (value: Screen) => void
  children: React.ReactNode
  onAdd: () => void
  shellVariant?: 'default' | 'plateau'
  headerTitle?: string
}) {
  const brandedHeader = screen === 'overview'
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = mainRef.current

    if (!element) return

    let startY = 0

    const handleTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0
    }

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? startY
      const deltaY = currentY - startY
      const atTop = element.scrollTop <= 0
      const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        event.preventDefault()
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [screen])

  return (
    <>
      {brandedHeader && shellVariant === 'default' ? (
        <header className="app-header app-header-brand">
          <img className="brand-mark brand-logo" src="/brand-logo.png" alt="Логотип Минус 40" data-brand-mark={BRAND_PLACEHOLDER_MARK} />
        </header>
      ) : brandedHeader && shellVariant === 'plateau' ? (
        <header className="app-header app-header-plateau">
          <h1 className="app-header-title app-header-title-plateau">{headerTitle}</h1>
        </header>
      ) : null}
      <main
        ref={mainRef}
        className={
          screen === 'settings'
            ? 'main-plain main-settings'
            : brandedHeader
              ? 'main-branded'
              : 'main-plain'
        }
      >
        {children}
      </main>
      {screen === 'overview' && shellVariant === 'default' && (
        <button
          className="fab"
          onClick={() => {
            triggerImpact('medium')
            onAdd()
          }}
          aria-label="Добавить замер"
        >
          +
        </button>
      )}
      <AppNav screen={screen} onChange={setScreen} />
    </>
  )
}

function Overview({ state, stageOverride, nowOverride }: { state: AppState; stageOverride?: 'cut' | 'plateau'; nowOverride?: number }) {
  const now = nowOverride ?? Date.now()
  const stage = stageOverride ?? currentStage(state, now)
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
  const journeyDays = daysInJourney(state.entries)
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

  if (stage === 'plateau') {
    const bounds = plateauBounds(state)
    const fillCount = plateauFillCount(state, now)

    return (
      <div className="plateau-screen">
        <div className="plateau-main">
          <section className="plateau-stage">
            <div className="plateau-composition">
              <div className="plateau-metrics plateau-metrics-top">
                <strong className="plateau-number plateau-number-top">
                  <span className="plateau-approx">≈</span>
                  {bounds.top === null ? '—' : `${bounds.top.toFixed(1)}`} <small>кг</small>
                </strong>
              </div>

              <div className="plateau-current">
                <span className="plateau-current-label">Сегодня</span>
                <strong className="plateau-current-number">{current === null ? '—' : `${current.toFixed(1)} кг`}</strong>
              </div>

              <div className="plateau-rail" aria-label="Шкала плато">
                {Array.from({ length: 7 }).map((_, index) => {
                  const active = index < fillCount
                  const roundedTop = index === 6
                  const roundedBottom = index === 0

                  return (
                    <span
                      key={index}
                      className={`plateau-segment${active ? ' is-active' : ''}${roundedTop ? ' is-top' : ''}${roundedBottom ? ' is-bottom' : ''}`}
                      aria-hidden="true"
                    />
                  )
                })}
              </div>

              <div className="plateau-metrics plateau-metrics-bottom">
                <strong className="plateau-number plateau-number-bottom">
                  {bounds.bottom === null ? '—' : `${bounds.bottom.toFixed(1)}`} <small>кг</small>
                </strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

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
            <b>Прогноз</b>
            {renderForecastText(forecast, milestone)}
          </em>
        </span>
      </section>

      <section className="total-card">
        <label>{isAboveStart ? 'ИЗМЕНЕНИЕ ОТ СТАРТА' : 'ВСЕГО СБРОШЕНО'}</label>
        <strong className="total-card-main">
          <span className="total-card-main-value">{(isAboveStart ? Math.abs(lostTotal) : lostTotal).toFixed(1)}</span>
          <small className="total-card-main-unit">кг</small>
          <em className="total-card-main-duration">{`за ${formatJourneyDuration(journeyDays)}`}</em>
        </strong>
        <p>{isAboveStart ? `Выше стартового веса ${formatWeight(state.startWeight)}` : `С момента начала ${formatWeight(state.startWeight)}`}</p>
      </section>
    </div>
  )
}

function History({
  state,
  onDelete,
  onOpenComment,
}: {
  state: AppState
  onDelete: (id: string) => void
  onOpenComment: (entryId: string, date: number) => void
}) {
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
      <section className="history-panel" aria-label={'\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0438\u0441\u0442\u043e\u0440\u0438\u0435\u0439'}>
        <div className="history-metrics" aria-label={'\u0421\u0432\u043e\u0434\u043a\u0430 \u043f\u043e \u0437\u0430\u043c\u0435\u0440\u0430\u043c'}>
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
        </div>
        <div className="history-range-switch" role="tablist" aria-label={'\u041f\u0435\u0440\u0438\u043e\u0434 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0438'}>
          {([
            ['week', '\u041d\u0435\u0434\u0435\u043b\u044f'],
            ['month', '\u041c\u0435\u0441\u044f\u0446'],
            ['year', '\u0413\u043e\u0434'],
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
        <div className="history-filter history-filter-secondary" role="tablist" aria-label={'\u0424\u0438\u043b\u044c\u0442\u0440 \u0437\u0430\u043c\u0435\u0440\u043e\u0432'}>
          {([
            ['all', '\u0412\u0441\u0435'],
            ['loss', '\u0421\u043d\u0438\u0436\u0435\u043d\u0438\u044f'],
            ['gain', '\u041d\u0430\u0431\u043e\u0440'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${filter === value ? 'active' : ''} ${value === 'loss' ? 'is-loss' : value === 'gain' ? 'is-gain' : ''}`.trim()}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              aria-label={
                value === 'all'
                  ? '\u0412\u0441\u0435'
                  : value === 'loss'
                    ? '\u0422\u043e\u043b\u044c\u043a\u043e \u0441\u043d\u0438\u0436\u0435\u043d\u0438\u0435'
                    : '\u0422\u043e\u043b\u044c\u043a\u043e \u043d\u0430\u0431\u043e\u0440'
              }
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
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
                <button
                  type="button"
                  className="history-comment-trigger"
                  aria-label={`Комментарий к дню ${formatDate(entry.date, true)}`}
                  onClick={() => {
                    triggerImpact('light')
                    onOpenComment(entry.id, entry.date)
                  }}
                >
                  ...
                </button>
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

function Settings({
  state,
  onSave,
  onOpenComment,
}: {
  state: AppState
  onSave: (start: number, target: number) => void
  onOpenComment: (targetType: CommentTargetType, targetKey: string) => void
}) {
  return <GoalsScreen state={state} onSave={onSave} onOpenComment={onOpenComment} />
}

function GraphScreen({ state }: { state: AppState }) {
  const chartWidth = 300
  const chartHeight = 164
  const chartEdgePadding = 14
  const [range, setRange] = useState<ChartRange>('week')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const filteredEntries = filterEntriesByRange(state.entries, range)
  const chronologicalEntries = [...filteredEntries].reverse()
  const points = chartPoints(filteredEntries, chartWidth - chartEdgePadding * 2, chartHeight).map((point) => ({
    ...point,
    x: point.x + chartEdgePadding,
  }))
  const averageChange = averagePeriodChange(filteredEntries)
  const totalChange = filteredEntries.length >= 2 ? filteredEntries[0].weight - filteredEntries[filteredEntries.length - 1].weight : null
  const activeIndex = selectedIndex
  const activePoint = activeIndex !== null ? points[activeIndex] ?? null : null
  const activeEntry = activeIndex !== null ? chronologicalEntries[activeIndex] : null
  const previousEntry = activeIndex !== null ? chronologicalEntries[activeIndex - 1] : null
  const activeDelta = activeEntry && previousEntry ? compareEntries(activeEntry, previousEntry) : null
  const longestStreak = longestLossStreak(filteredEntries)
  const monthChange = monthlyCalendarChange(state.entries)
  const journeyDays = daysInJourney(state.entries)
  const activeBubbleTop = activePoint ? clamp((activePoint.y / chartHeight) * 100 - 8, 16, 78) : 24
  const axisLabelY = chartHeight + 22
  const graphDensityClass = range === 'week' ? 'is-week' : range === 'month' ? 'is-month' : 'is-year'

  return (
    <div className="graph">
      <h1>{'График веса'}</h1>
      <div className="graph-range-switch" role="tablist" aria-label={'Период графика'}>
        {([
          ['week', 'Неделя'],
          ['month', 'Месяц'],
          ['year', 'Год'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={range === value ? 'active' : ''}
            onClick={() => {
              setRange(value)
              setSelectedIndex(null)
            }}
            aria-pressed={range === value}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="graph-summary" aria-label={'Сводка графика'}>
        <article>
          <small>{'Изменение'}</small>
          <strong className={totalChange !== null && totalChange > 0 ? 'red' : 'orange'}>
            {totalChange === null ? '—' : `${formatDelta(totalChange)} кг`}
          </strong>
        </article>
        <article>
          <small>{'Средний темп'}</small>
          <strong className={averageChange !== null && averageChange > 0 ? 'red' : 'orange'}>
            {averageChange === null ? '—' : `${formatDelta(averageChange)} кг/д`}
          </strong>
        </article>
      </section>
      <section className={`big-chart big-chart-graph ${graphDensityClass}`}>
        {points.length > 1 ? (
          <>
            <div className="graph-plot">
              {activePoint ? (
                <div
                  className="graph-popover"
                  aria-live="polite"
                  style={{ left: `${clamp((activePoint.x / chartWidth) * 100, 20, 80)}%`, top: `${activeBubbleTop}%` }}
                >
                  <b>{formatDate(activePoint.date, true)}</b>
                  <span>{formatWeight(activeEntry?.weight ?? activePoint.weight)}</span>
                  {activeDelta !== null ? (
                    <em className={activeDelta > 0 ? 'red' : activeDelta < 0 ? 'orange' : ''}>
                      {`${formatDelta(activeDelta)} кг`}
                    </em>
                  ) : null}
                </div>
              ) : null}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} preserveAspectRatio="none">
                <line x1="0" x2={chartWidth} y1="36" y2="36" />
                <line x1="0" x2={chartWidth} y1="90" y2="90" />
                <line x1="0" x2={chartWidth} y1="144" y2="144" />
                {points.slice(0, -1).map((point, index) => {
                  const nextPoint = points[index + 1]
                  const segmentDelta = nextPoint.weight - point.weight

                  return (
                    <line
                      key={`${point.date}-${nextPoint.date}`}
                      x1={point.x}
                      y1={point.y}
                      x2={nextPoint.x}
                      y2={nextPoint.y}
                      className={segmentDelta > 0 ? 'segment-red' : 'segment-orange'}
                    />
                  )
                })}
                {points.map((point, index) => (
                  <g key={point.date} className="graph-point-hit" onClick={() => setSelectedIndex(index)}>
                    <circle cx={point.x} cy={point.y} r="16" className="point-hit-area" />
                    {index === activeIndex ? <circle cx={point.x} cy={point.y} r={range === 'week' ? '12' : range === 'month' ? '10' : '9'} className="point-active-ring" /> : null}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={
                        range === 'week'
                          ? index === activeIndex ? '8' : '7'
                          : range === 'month'
                            ? index === activeIndex ? '6' : '5'
                            : index === activeIndex ? '5.5' : '4.5'
                      }
                      className={index === activeIndex ? 'point-active' : 'point'}
                    />
                  </g>
                ))}
                {points.map((point, index) => (
                  <g
                    key={`label-${point.date}`}
                    className={`graph-axis-label${index === activeIndex ? ' active' : ''}`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <text x={point.x} y={axisLabelY} textAnchor="middle">
                      {new Intl.DateTimeFormat('ru-RU', { day: 'numeric' }).format(new Date(point.date))}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </>
        ) : (
          <p className="empty">Добавьте ещё 1-2 замера для более точного тренда.</p>
        )}
      </section>
      <section className="graph-insights" aria-label={'Аналитика периода'}>
        <article>
          <small>{'Серия снижения'}</small>
          <strong>
            {longestStreak === null ? '—' : `${longestStreak} ${pluralizeDays(longestStreak)}`}
          </strong>
          <p>{longestStreak === null ? 'Нужно больше данных' : 'Подряд без набора'}</p>
        </article>
        <article>
          <small>{'Средний темп'}</small>
          <strong className={averageChange !== null && averageChange > 0 ? 'red' : 'orange'}>
            {averageChange === null ? '—' : `${formatDelta(averageChange)} кг/д`}
          </strong>
          <p>{averageChange === null ? 'Нужно больше данных' : 'В среднем за период'}</p>
        </article>
        <article>
          <small>{'За месяц'}</small>
          <strong className={monthChange !== null && monthChange > 0 ? 'red' : monthChange !== null && monthChange < 0 ? 'orange' : ''}>
            {monthChange === null ? '—' : `${formatDelta(monthChange)} кг`}
          </strong>
          <p className={monthChange !== null && monthChange < 0 ? 'orange' : monthChange !== null && monthChange > 0 ? 'red' : ''}>
            {monthChange === null ? 'Нужно больше данных' : monthChange > 0 ? 'Регресс' : 'Прогресс'}
          </p>
        </article>
        <article>
          <small>{'Дней в пути'}</small>
          <strong>{journeyDays === null ? '—' : journeyDays}</strong>
        </article>
      </section>
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
          <button className="close" type="button" onClick={requestClose} aria-label="Закрыть">
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
          <div className="milestone-dialog-badge">
            <RoadmapNodeBadge kind="start" status="reached" icon="flag" />
          </div>
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

export function AppUI({
  state,
  onAdd,
  onDelete,
  onSettings,
  onGetComment,
  onUpsertComment,
  onDeleteComment,
  initialScreen = 'overview',
  stageOverride,
  nowOverride,
}: Props) {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [adding, setAdding] = useState(false)
  const [reached, setReached] = useState<number | null>(null)
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)

  const add = (weight: number) => {
    const before = nextMilestone(state)
    onAdd(weight)

    if (before !== null && weight <= before) setReached(before)
  }

  const openAdd = () => setAdding(true)

  const openMilestoneComment = (_targetType: CommentTargetType, targetKey: string) => {
    const milestoneWeight = Number.parseFloat(targetKey)

    setCommentTarget({
      type: 'milestone',
      key: targetKey,
      title: Number.isFinite(milestoneWeight) ? `Рубеж ${formatWeight(milestoneWeight)}` : 'Рубеж',
      subtitle: 'Нажмите, чтобы добавить или изменить комментарий.',
    })
  }

  const openEntryComment = (entryId: string, date: number) => {
    setCommentTarget({
      type: 'weight_entry',
      key: entryId,
      title: 'Комментарий дня',
      subtitle: formatDate(date, true),
    })
  }

  const view =
    screen === 'overview' ? (
      <Overview state={state} stageOverride={stageOverride} nowOverride={nowOverride} />
    ) : screen === 'history' ? (
      <History state={state} onDelete={onDelete} onOpenComment={openEntryComment} />
    ) : screen === 'graph' ? (
      <GraphScreen state={state} />
    ) : (
      <Settings state={state} onSave={onSettings} onOpenComment={openMilestoneComment} />
    )

  return (
    <Layout
      screen={screen}
      setScreen={setScreen}
      onAdd={openAdd}
      shellVariant={stageOverride === 'plateau' && screen === 'overview' ? 'plateau' : 'default'}
      headerTitle="Плато"
    >
      <ScreenTransition screen={screen}>{view}</ScreenTransition>
      {adding && <AddDialog onClose={() => setAdding(false)} onAdd={add} />}
      {reached !== null && <MilestoneDialog value={reached} onClose={() => setReached(null)} />}
      {commentTarget !== null ? (
        <CommentDialog
          target={commentTarget}
          initialText={onGetComment(commentTarget.type, commentTarget.key)?.text ?? ''}
          onClose={() => setCommentTarget(null)}
          onSave={(text) => onUpsertComment(commentTarget.type, commentTarget.key, text)}
          onDelete={() => onDeleteComment(commentTarget.type, commentTarget.key)}
        />
      ) : null}
    </Layout>
  )
}



