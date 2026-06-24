import { useEffect, useMemo, useRef, useState } from 'react'
import { initializeTelegramWebApp } from './features/telegram/webapp'
import { loadWeightEntries, saveWeightEntries } from './features/weight/storage'
import type { WeightEntry } from './features/weight/types'

const initialEntries = loadWeightEntries()
const START_WEIGHT = 150
const GOAL_WEIGHT = 110
const MILESTONES = [150, 140, 130, 120, 110] as const
const HISTORY_PREVIEW_LIMIT = 3

type MilestoneState = 'passed' | 'current' | 'upcoming'

function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} кг`
}

function formatCompactWeight(weight: number): string {
  return weight.toFixed(1).replace('.', ',')
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  })
    .format(new Date(date))
    .replace('.', '')
}

function formatSignedWeightDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1).replace('.', ',')} кг`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} %`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getWeeklyChange(entries: WeightEntry[]): number | null {
  if (entries.length < 2) {
    return null
  }

  const currentEntry = entries[0]
  const threshold = new Date(currentEntry.date).getTime() - 7 * 24 * 60 * 60 * 1000
  const referenceEntry = entries.find((entry, index) => index > 0 && new Date(entry.date).getTime() <= threshold)

  if (!referenceEntry) {
    return null
  }

  return currentEntry.weight - referenceEntry.weight
}

function getNextMilestone(weight: number | null): number | null {
  if (weight === null) {
    return MILESTONES[0]
  }

  return MILESTONES.find((milestone) => weight > milestone) ?? null
}

function getMilestoneState(weight: number | null, milestone: number, nextMilestone: number | null): MilestoneState {
  if (weight !== null && weight <= milestone) {
    return 'passed'
  }

  if (nextMilestone === milestone) {
    return 'current'
  }

  return 'upcoming'
}

function App() {
  const [entries, setEntries] = useState<WeightEntry[]>(initialEntries)
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')
  const [isEntryPanelOpen, setIsEntryPanelOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => initializeTelegramWebApp(), [])

  const currentWeight = useMemo(() => entries[0]?.weight ?? null, [entries])
  const weeklyChange = useMemo(() => getWeeklyChange(entries), [entries])
  const nextMilestone = useMemo(() => getNextMilestone(currentWeight), [currentWeight])
  const remainingToGoal = useMemo(
    () => (currentWeight === null ? START_WEIGHT - GOAL_WEIGHT : Math.max(currentWeight - GOAL_WEIGHT, 0)),
    [currentWeight],
  )
  const goalProgressPercent = useMemo(() => {
    if (currentWeight === null) {
      return 0
    }

    return clamp(((START_WEIGHT - currentWeight) / (START_WEIGHT - GOAL_WEIGHT)) * 100, 0, 100)
  }, [currentWeight])
  const previewEntries = useMemo(() => entries.slice(0, HISTORY_PREVIEW_LIMIT), [entries])
  const currentFocusLabel = useMemo(() => {
    if (currentWeight === null) {
      return 'Текущий фокус: Первый замер'
    }

    if (nextMilestone === null) {
      return 'Текущий фокус: Цель 110 кг достигнута'
    }

    return `Текущий фокус: Снижение до ${formatCompactWeight(nextMilestone)} кг`
  }, [currentWeight, nextMilestone])
  const weeklyTrendLabel = useMemo(() => {
    if (weeklyChange === null) {
      return 'Неделя не определена'
    }

    if (weeklyChange < 0) {
      return 'Снижение за неделю'
    }

    if (weeklyChange > 0) {
      return 'Изменение за неделю'
    }

    return 'Без изменения за неделю'
  }, [weeklyChange])

  function handleSave() {
    const normalizedValue = weight.replace(',', '.').trim()
    const parsedWeight = Number(normalizedValue)

    if (!normalizedValue) {
      setError('Введите вес.')
      return
    }

    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Введите корректный вес в килограммах.')
      return
    }

    const nextEntry: WeightEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      weight: parsedWeight,
    }

    const nextEntries = [nextEntry, ...entries]

    setEntries(nextEntries)
    saveWeightEntries(nextEntries)
    setWeight('')
    setError('')
    setIsEntryPanelOpen(false)
  }

  function handleOpenEntryPanel() {
    setIsEntryPanelOpen(true)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <main className="app">
      <header className="app-bar">
        <div className="app-bar__brand">
          <span className="app-bar__mark" aria-hidden="true">
            +
          </span>
          <h1 id="app-title">Минус 40</h1>
        </div>
      </header>

      <div className="app-shell">
        <section className="hero" aria-live="polite">
          <span className="section-label">Текущий вес</span>
          {currentWeight === null ? (
            <p className="hero__empty">Пока нет ни одной записи. Внесите первый вес, чтобы построить путь.</p>
          ) : (
            <div className="hero__value-row">
              <p className="hero__value">{formatCompactWeight(currentWeight)}</p>
              <span className="hero__unit">кг</span>
              <span className={`trend-pill${weeklyChange !== null && weeklyChange < 0 ? ' trend-pill--good' : ''}`}>
                {weeklyChange !== null && weeklyChange < 0 ? 'К цели' : 'В фокусе'}
              </span>
            </div>
          )}
        </section>

        <section className="journey-card" aria-labelledby="journey-title">
          <div className="journey-card__header">
            <span className="section-label journey-card__title" id="journey-title">
              Карта пути
            </span>
            <span className="journey-card__goal">Цель: {GOAL_WEIGHT} кг</span>
          </div>

          <div className="journey-map">
            <div className="journey-map__track" aria-hidden="true" />
            <div
              className="journey-map__progress"
              aria-hidden="true"
              style={{ width: `${goalProgressPercent}%` }}
            />

            <div className="journey-map__nodes">
              {MILESTONES.map((milestone) => {
                const state = getMilestoneState(currentWeight, milestone, nextMilestone)

                return (
                  <div className={`journey-node journey-node--${state}`} key={milestone}>
                    <div className="journey-node__marker">
                      <span className={`journey-node__core journey-node__core--${state}`} />
                    </div>
                    <span className="journey-node__label">{milestone}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="journey-card__focus">{currentFocusLabel}</p>
        </section>

        <section className="metrics-grid" aria-label="Ключевые метрики">
          <article className="metric-card">
            <span className="metric-card__label">До цели</span>
            <span className="metric-card__value">{formatCompactWeight(remainingToGoal)} кг</span>
          </article>

          <article className="metric-card">
            <span className="metric-card__label">Прогресс</span>
            <span className="metric-card__value metric-card__value--accent">{formatPercent(goalProgressPercent)}</span>
          </article>
        </section>

        <section className="milestone-card" aria-labelledby="milestone-title">
          <div className="milestone-card__header">
            <div>
              <span className="milestone-card__eyebrow" id="milestone-title">
                Следующий рубеж
              </span>
              <h2 className="milestone-card__goal-value">
                {nextMilestone === null ? '110,0 кг' : `${formatCompactWeight(nextMilestone)} кг`}
              </h2>
            </div>

            <div className="milestone-card__weekly">
              <span className={`milestone-card__weekly-value${weeklyChange !== null && weeklyChange < 0 ? ' milestone-card__weekly-value--good' : ''}`}>
                {weeklyChange === null ? '—' : formatSignedWeightDelta(weeklyChange)}
              </span>
              <span className="milestone-card__weekly-label">{weeklyTrendLabel}</span>
            </div>
          </div>

          <div className="milestone-card__progress">
            <div
              className="milestone-card__progress-fill"
              style={{
                width: `${
                  nextMilestone === null || currentWeight === null
                    ? goalProgressPercent
                    : clamp(((START_WEIGHT - currentWeight) / (START_WEIGHT - nextMilestone)) * 100, 0, 100)
                }%`,
              }}
            />
          </div>

          <div className="milestone-card__footer">
            <span>
              {currentWeight === null
                ? 'Нужен первый замер'
                : nextMilestone === null
                  ? 'Финальная цель уже достигнута'
                  : `Осталось ${formatCompactWeight(Math.max(currentWeight - nextMilestone, 0))} кг`}
            </span>
            <span className="milestone-card__footer-secondary">Путь: 150 → 110</span>
          </div>
        </section>

        <section className="history-preview" aria-labelledby="history-title">
          <div className="history-preview__header">
            <h2 id="history-title">История замеров</h2>
            <button className="history-preview__all" type="button" disabled>
              Все
            </button>
          </div>

          {previewEntries.length === 0 ? (
            <p className="history-preview__empty">
              История пока пустая. После сохранения измерения появятся здесь.
            </p>
          ) : (
            <div className="history-preview__list" aria-live="polite">
              {previewEntries.map((entry, index) => (
                <article className="history-row" key={entry.id}>
                  <div className="history-row__left">
                    <span className={`history-row__dot${index === 0 ? ' history-row__dot--latest' : ''}`} aria-hidden="true" />
                    <span className="history-row__date" title={formatDate(entry.date)}>
                      {formatShortDate(entry.date)}
                    </span>
                  </div>
                  <div className="history-row__right">
                    <span className="history-row__weight">{formatWeight(entry.weight)}</span>
                    <span className="history-row__arrow" aria-hidden="true">
                      &gt;
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {isEntryPanelOpen ? (
        <section className="entry-panel" aria-labelledby="entry-panel-title">
          <div className="entry-panel__header">
            <h2 id="entry-panel-title">Новый замер</h2>
            <button
              className="entry-panel__close"
              type="button"
              onClick={() => {
                setIsEntryPanelOpen(false)
                setError('')
              }}
            >
              Закрыть
            </button>
          </div>

          <label className="entry-panel__label" htmlFor="weight-input">
            Вес, кг
          </label>
          <input
            id="weight-input"
            ref={inputRef}
            className="entry-panel__input"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            placeholder="Например, 149,4"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value)
              if (error) {
                setError('')
              }
            }}
          />
          {error ? (
            <p className="entry-panel__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="entry-panel__actions">
            <button
              className="entry-panel__button entry-panel__button--ghost"
              type="button"
              onClick={() => {
                setIsEntryPanelOpen(false)
                setError('')
              }}
            >
              Отмена
            </button>
            <button className="entry-panel__button entry-panel__button--primary" type="button" onClick={handleSave}>
              Сохранить
            </button>
          </div>
        </section>
      ) : null}

      <div className="floating-action">
        <button className="floating-action__button" type="button" onClick={handleOpenEntryPanel}>
          <span className="floating-action__icon" aria-hidden="true">
            +
          </span>
          <span className="floating-action__label">Внести вес</span>
        </button>
      </div>

      <nav className="bottom-nav" aria-label="Навигация">
        <button className="bottom-nav__item bottom-nav__item--active" type="button" disabled>
          <span className="bottom-nav__icon">[]</span>
          <span className="bottom-nav__label">Обзор</span>
        </button>
        <button className="bottom-nav__item" type="button" disabled>
          <span className="bottom-nav__icon">()</span>
          <span className="bottom-nav__label">История</span>
        </button>
        <button className="bottom-nav__item" type="button" disabled>
          <span className="bottom-nav__icon">::</span>
          <span className="bottom-nav__label">Настройки</span>
        </button>
      </nav>
    </main>
  )
}

export default App
