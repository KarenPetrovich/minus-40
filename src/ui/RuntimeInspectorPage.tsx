import { useEffect, useMemo, useState } from 'react'

type InspectorSnapshot = {
  device: Record<string, string>
  telegram: Record<string, string>
  cssVars: Array<[string, string]>
}

type TelegramRuntime = {
  version?: string
  platform?: string
  colorScheme?: string
  isExpanded?: boolean
  viewportHeight?: number
  viewportStableHeight?: number
  headerColor?: string
  backgroundColor?: string
  safeAreaInset?: unknown
  contentSafeAreaInset?: unknown
  bottomBarHeight?: unknown
}

function getValue(value: unknown) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function readCssVars(): Array<[string, string]> {
  const styles = getComputedStyle(document.documentElement)
  const vars: Array<[string, string]> = []

  for (let index = 0; index < styles.length; index += 1) {
    const name = styles[index]

    if (name.startsWith('--tg-')) {
      vars.push([name, styles.getPropertyValue(name).trim()])
    }
  }

  return vars.sort(([a], [b]) => a.localeCompare(b))
}

function getTelegramWebApp() {
  return ((window as Window & { Telegram?: { WebApp?: TelegramRuntime } }).Telegram?.WebApp as TelegramRuntime | null) ?? null
}

function readSnapshot(): InspectorSnapshot {
  const webApp = getTelegramWebApp()
  const viewport = window.visualViewport

  const device: Record<string, string> = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    devicePixelRatio: String(window.devicePixelRatio),
    'screen.width': String(window.screen.width),
    'screen.height': String(window.screen.height),
    'screen.availWidth': String(window.screen.availWidth),
    'screen.availHeight': String(window.screen.availHeight),
    'window.innerWidth': String(window.innerWidth),
    'window.innerHeight': String(window.innerHeight),
    'window.outerWidth': String(window.outerWidth),
    'window.outerHeight': String(window.outerHeight),
    'visualViewport.width': viewport ? String(viewport.width) : 'unavailable',
    'visualViewport.height': viewport ? String(viewport.height) : 'unavailable',
    'visualViewport.scale': viewport ? String(viewport.scale) : 'unavailable',
  }

  const telegram: Record<string, string> = {
    'Telegram.WebApp.version': getValue(webApp?.version),
    'Telegram.WebApp.platform': getValue(webApp?.platform),
    'Telegram.WebApp.colorScheme': getValue(webApp?.colorScheme),
    'Telegram.WebApp.isExpanded': getValue(webApp?.isExpanded),
    'Telegram.WebApp.viewportHeight': getValue(webApp?.viewportHeight),
    'Telegram.WebApp.viewportStableHeight': getValue(webApp?.viewportStableHeight),
    'Telegram.WebApp.headerColor': getValue(webApp?.headerColor),
    'Telegram.WebApp.backgroundColor': getValue(webApp?.backgroundColor),
    safeAreaInset: getValue(webApp?.safeAreaInset),
    contentSafeAreaInset: getValue(webApp?.contentSafeAreaInset),
    bottomBarHeight: getValue((webApp as { bottomBarHeight?: unknown } | null)?.bottomBarHeight),
  }

  return {
    device,
    telegram,
    cssVars: readCssVars(),
  }
}

function formatReport(snapshot: InspectorSnapshot) {
  const lines: string[] = []

  lines.push('=== DEVICE ===')
  for (const [key, value] of Object.entries(snapshot.device)) {
    lines.push(`${key}: ${value}`)
  }

  lines.push('')
  lines.push('=== TELEGRAM ===')
  for (const [key, value] of Object.entries(snapshot.telegram)) {
    lines.push(`${key}: ${value}`)
  }

  lines.push('')
  lines.push('=== CSS ===')
  if (snapshot.cssVars.length === 0) {
    lines.push('(no --tg-* CSS variables found)')
  } else {
    for (const [key, value] of snapshot.cssVars) {
      lines.push(`${key}: ${value}`)
    }
  }

  lines.push('')
  lines.push('=== LIVE ===')
  lines.push('auto-refresh: enabled')

  return lines.join('\n')
}

export function RuntimeInspectorPage() {
  const [snapshot, setSnapshot] = useState<InspectorSnapshot>(() => readSnapshot())

  useEffect(() => {
    const update = () => setSnapshot(readSnapshot())

    update()

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    const intervalId = window.setInterval(update, 500)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.clearInterval(intervalId)
    }
  }, [])

  const report = useMemo(() => formatReport(snapshot), [snapshot])

  return (
    <div className="runtime-inspector">
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(report)
        }}
      >
        Скопировать всё
      </button>
      <pre>{report}</pre>
    </div>
  )
}
