import { useState } from 'react'
import type { AppState, CommentTargetType, Screen } from '../core/types'
import type { CloudMeta } from '../core/storage'
import type { RefreshOutcome } from '../core/store'
import { AppUI } from './AppUI'

type Props = {
  state: AppState
  initialScreen: Screen
  cloudMeta: CloudMeta
  onRefresh: () => Promise<RefreshOutcome>
  onAdd: (weight: number) => void
  onDelete: (id: string) => void
  onSettings: (start: number, target: number) => void
  onGetComment: (targetType: CommentTargetType, targetKey: string) => { id: string; text: string } | null
  onUpsertComment: (targetType: CommentTargetType, targetKey: string, text: string) => void
  onDeleteComment: (targetType: CommentTargetType, targetKey: string) => void
}

function formatSyncedAt(value: number | null): string {
  if (!value) {
    return 'неизвестно'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function DeveloperPreviewPage({
  state,
  initialScreen,
  cloudMeta,
  onRefresh,
  onAdd,
  onDelete,
  onSettings,
  onGetComment,
  onUpsertComment,
  onDeleteComment,
}: Props) {
  const [stageOverride, setStageOverride] = useState<'cut' | 'plateau' | null>('cut')
  const [dayOffset, setDayOffset] = useState(0)
  const [refreshStatus, setRefreshStatus] = useState<RefreshOutcome | 'idle' | 'pending'>('idle')

  const previewState =
    stageOverride === 'plateau' && (state.plateauStartedAt === null || state.plateauStartedAt === undefined)
      ? {
          ...state,
          plateauStartedAt: Date.now(),
        }
      : state

  const plateauAnchor = previewState.plateauStartedAt ?? Date.now()
  const nowOverride =
    previewState.plateauStartedAt !== null && previewState.plateauStartedAt !== undefined
      ? plateauAnchor + dayOffset * 86400000
      : Date.now() + dayOffset * 86400000

  return (
    <div className="developer-preview-shell">
      <div className="developer-preview-controls">
        <button
          type="button"
          className="developer-preview-control-button"
          onClick={async () => {
            if (refreshStatus === 'pending') {
              return
            }

            setRefreshStatus('pending')
            const nextStatus = await onRefresh()
            setRefreshStatus(nextStatus)
          }}
        >
          Обновить данные
        </button>
        <button
          type="button"
          className="developer-preview-control-button"
          onClick={() => {
            setStageOverride((current) => {
              const next = current === 'plateau' ? null : 'plateau'

              if (next === 'plateau') {
                setDayOffset(0)
              }

              return next
            })
          }}
        >
          Плато/Обзор
        </button>
        <button
          type="button"
          className="developer-preview-control-button"
          onClick={() => {
            setDayOffset((current) => {
              const next = current + 1

              if (stageOverride === 'plateau' && next > 7) {
                setStageOverride(null)
              }

              return next
            })
          }}
        >
          +1 Плато
        </button>

        <div className={`developer-preview-status developer-preview-status-${refreshStatus === 'idle' || refreshStatus === 'pending' ? refreshStatus : refreshStatus.source}`}>
          {refreshStatus === 'idle'
            ? 'Статус: не выполнялось'
            : refreshStatus === 'pending'
              ? 'Статус: проверяем Supabase...'
              : refreshStatus.source === 'supabase'
                ? 'Статус: данные обновлены из Supabase'
                : refreshStatus.usedLocalCache
                  ? 'Статус: локальный кэш; Supabase недоступен без Telegram initData'
                  : 'Статус: Supabase недоступен без Telegram initData'}
        </div>
        <div className="developer-preview-snapshot-status">
          Источник: {cloudMeta.cloudMode ? 'cloud-cache' : 'локальный snapshot'} · Последняя синхронизация: {formatSyncedAt(cloudMeta.lastSyncedAt)}
        </div>
      </div>

      <div className="developer-preview-stage">
        <div className="developer-preview-frame" aria-hidden="true" />
        <div className="developer-preview-viewport">
          <AppUI
            state={previewState}
            onAdd={onAdd}
            onDelete={onDelete}
            onSettings={onSettings}
            onGetComment={onGetComment}
            onUpsertComment={onUpsertComment}
            onDeleteComment={onDeleteComment}
            initialScreen={initialScreen}
            stageOverride={stageOverride ?? undefined}
            nowOverride={nowOverride}
          />
        </div>
      </div>
    </div>
  )
}
