export type SlideDirection = 'up' | 'down' | 'left' | 'right'

type AnimationOptions = {
  duration?: number
  onUpdate: (value: number) => void
  onComplete?: () => void
}

type ValueAnimationOptions = {
  from: number
  to: number
  duration?: number
  onUpdate: (value: number) => void
  onComplete?: () => void
}

const CURVE_X1 = 0.2
const CURVE_Y1 = 0.8
const CURVE_X2 = 0.2
const CURVE_Y2 = 1

const NEWTON_ITERATIONS = 8
const SUBDIVISION_PRECISION = 0.0000001
const SUBDIVISION_MAX_ITERATIONS = 10
const SAMPLE_SIZE = 11
const SAMPLE_STEP = 1 / (SAMPLE_SIZE - 1)

function a(a1: number, a2: number) {
  return 1 - 3 * a2 + 3 * a1
}

function b(a1: number, a2: number) {
  return 3 * a2 - 6 * a1
}

function c(a1: number) {
  return 3 * a1
}

function calcBezier(t: number, a1: number, a2: number) {
  return ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t
}

function getSlope(t: number, a1: number, a2: number) {
  return 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1)
}

function binarySubdivide(x: number, start: number, end: number) {
  let current = start
  let value = 0

  for (let i = 0; i < SUBDIVISION_MAX_ITERATIONS; i += 1) {
    current = start + (end - start) / 2
    value = calcBezier(current, CURVE_X1, CURVE_X2) - x

    if (Math.abs(value) <= SUBDIVISION_PRECISION) {
      return current
    }

    if (value > 0) {
      end = current
    } else {
      start = current
    }
  }

  return current
}

function getTForX(x: number) {
  const samples = new Float32Array(SAMPLE_SIZE)

  for (let i = 0; i < SAMPLE_SIZE; i += 1) {
    samples[i] = calcBezier(i * SAMPLE_STEP, CURVE_X1, CURVE_X2)
  }

  let intervalStart = 0
  let sampleIndex = 1

  for (; sampleIndex < SAMPLE_SIZE - 1 && samples[sampleIndex] <= x; sampleIndex += 1) {
    intervalStart += SAMPLE_STEP
  }

  sampleIndex -= 1

  const dist = (x - samples[sampleIndex]) / (samples[sampleIndex + 1] - samples[sampleIndex])
  let guess = intervalStart + dist * SAMPLE_STEP
  const slope = getSlope(guess, CURVE_X1, CURVE_X2)

  if (slope >= 0.001) {
    for (let i = 0; i < NEWTON_ITERATIONS; i += 1) {
      const currentSlope = getSlope(guess, CURVE_X1, CURVE_X2)

      if (currentSlope === 0) {
        return guess
      }

      const currentX = calcBezier(guess, CURVE_X1, CURVE_X2) - x
      guess -= currentX / currentSlope
    }

    return guess
  }

  if (slope === 0) {
    return guess
  }

  return binarySubdivide(x, intervalStart, intervalStart + SAMPLE_STEP)
}

function ease(progress: number) {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  return calcBezier(getTForX(progress), CURVE_Y1, CURVE_Y2)
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animate({ duration = 240, onUpdate, onComplete }: AnimationOptions) {
  if (prefersReducedMotion()) {
    onUpdate(1)
    onComplete?.()
    return () => undefined
  }

  let frame = 0
  const start = performance.now()

  const tick = (time: number) => {
    const elapsed = Math.min((time - start) / duration, 1)
    onUpdate(ease(elapsed))

    if (elapsed < 1) {
      frame = window.requestAnimationFrame(tick)
      return
    }

    onComplete?.()
  }

  frame = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(frame)
}

function clearHints(element: HTMLElement) {
  element.style.willChange = ''
}

export function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

export function fadeIn(element: HTMLElement, duration = 240) {
  element.style.opacity = '0'
  element.style.willChange = 'opacity'

  return animate({
    duration,
    onUpdate: (value) => {
      element.style.opacity = String(value)
    },
    onComplete: () => {
      element.style.opacity = '1'
      clearHints(element)
    },
  })
}

export function fadeOut(element: HTMLElement, duration = 200) {
  element.style.opacity = '1'
  element.style.willChange = 'opacity'

  return animate({
    duration,
    onUpdate: (value) => {
      element.style.opacity = String(1 - value)
    },
    onComplete: () => {
      element.style.opacity = '0'
      clearHints(element)
    },
  })
}

export function slideIn(element: HTMLElement, direction: SlideDirection = 'up', duration = 240) {
  element.style.opacity = '0'
  element.style.willChange = 'transform, opacity'

  return animate({
    duration,
    onUpdate: (value) => {
      const remaining = 1 - value
      const x =
        direction === 'left'
          ? 18 * remaining
          : direction === 'right'
            ? -18 * remaining
            : 0
      const y =
        direction === 'up'
          ? 18 * remaining
          : direction === 'down'
            ? -18 * remaining
            : 0

      element.style.opacity = String(value)
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`
    },
    onComplete: () => {
      element.style.opacity = '1'
      element.style.transform = 'translate3d(0, 0, 0)'
      clearHints(element)
    },
  })
}

export function animateValue({ from, to, duration = 240, onUpdate, onComplete }: ValueAnimationOptions) {
  if (from === to || prefersReducedMotion()) {
    onUpdate(to)
    onComplete?.()
    return () => undefined
  }

  return animate({
    duration,
    onUpdate: (value) => {
      onUpdate(lerp(from, to, value))
    },
    onComplete,
  })
}
