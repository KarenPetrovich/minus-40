type TelegramThemeParams = {
  bg_color?: string
  text_color?: string
}

type TelegramInsets = {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

type TelegramWebApp = {
  initData?: string
  initDataUnsafe?: {
    user?: {
      id?: number
      username?: string
      first_name?: string
      last_name?: string
    }
  }
  ready: () => void
  expand: () => void
  disableVerticalSwipes?: () => void
  enableVerticalSwipes?: () => void
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    selectionChanged?: () => void
    notificationOccurred?: (type: 'success' | 'warning' | 'error') => void
  }
  onEvent?: (eventType: string, handler: () => void) => void
  offEvent?: (eventType: string, handler: () => void) => void
  themeParams?: TelegramThemeParams
  safeAreaInset?: TelegramInsets
  contentSafeAreaInset?: TelegramInsets
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}

function getTelegramWebApp(): TelegramWebApp | null {
  const telegramWindow = window as TelegramWindow

  return telegramWindow.Telegram?.WebApp ?? null
}

function setCssVariable(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value)
}

function updateSafeAreaVariables(webApp: TelegramWebApp | null): void {
  if (!webApp) {
    setCssVariable('--safe-top', '0px')
    setCssVariable('--safe-bottom', '0px')
    setCssVariable('--safe-left', '0px')
    setCssVariable('--safe-right', '0px')
    return
  }

  const safe = webApp.safeAreaInset ?? {}
  const contentSafe = webApp.contentSafeAreaInset ?? {}

  const top = (safe.top ?? 0) + (contentSafe.top ?? 0)
  const bottom = (safe.bottom ?? 0) + (contentSafe.bottom ?? 0)
  const left = Math.max(safe.left ?? 0, contentSafe.left ?? 0)
  const right = Math.max(safe.right ?? 0, contentSafe.right ?? 0)

  setCssVariable('--safe-top', `${top}px`)
  setCssVariable('--safe-bottom', `${bottom}px`)
  setCssVariable('--safe-left', `${left}px`)
  setCssVariable('--safe-right', `${right}px`)
}

function applyThemeFallbacks(webApp: TelegramWebApp | null): void {
  const backgroundColor = webApp?.themeParams?.bg_color
  const textColor = webApp?.themeParams?.text_color

  if (backgroundColor) {
    setCssVariable('--tg-bg-color', backgroundColor)
  }

  if (textColor) {
    setCssVariable('--tg-text-color', textColor)
  }
}

export function triggerImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light'): void {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred?.(style)
}

export function triggerSelection(): void {
  getTelegramWebApp()?.HapticFeedback?.selectionChanged?.()
}

export function triggerNotification(type: 'success' | 'warning' | 'error'): void {
  getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.(type)
}

export function getTelegramInitData(): string {
  return getTelegramWebApp()?.initData ?? ''
}

export function subscribeTelegramEvent(eventType: string, handler: () => void): () => void {
  const webApp = getTelegramWebApp()

  if (!webApp) {
    return () => {}
  }

  webApp.onEvent?.(eventType, handler)

  return () => {
    webApp.offEvent?.(eventType, handler)
  }
}

export function initializeTelegramWebApp(): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const webApp = getTelegramWebApp()
  const safeAreaHandler = () => updateSafeAreaVariables(getTelegramWebApp())

  updateSafeAreaVariables(webApp)
  applyThemeFallbacks(webApp)

  if (!webApp) {
    return () => {}
  }

  webApp.ready()
  webApp.expand()
  webApp.disableVerticalSwipes?.()

  const headerColor = webApp.themeParams?.bg_color

  if (headerColor) {
    webApp.setHeaderColor?.(headerColor)
    webApp.setBackgroundColor?.(headerColor)
  }

  webApp.onEvent?.('safeAreaChanged', safeAreaHandler)
  webApp.onEvent?.('contentSafeAreaChanged', safeAreaHandler)

  return () => {
    webApp.offEvent?.('safeAreaChanged', safeAreaHandler)
    webApp.offEvent?.('contentSafeAreaChanged', safeAreaHandler)
  }
}
