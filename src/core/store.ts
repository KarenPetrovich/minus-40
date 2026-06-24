import { loadState, saveState } from './storage'
let state = loadState(); const listeners = new Set<() => void>()
const emit = () => { saveState(state); listeners.forEach((listener) => listener()) }
export const weightStore = {
  getSnapshot: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) },
  addWeight(weight: number, date = Date.now()) { state = { ...state, entries: [{ id: crypto.randomUUID(), date, weight }, ...state.entries].sort((a, b) => b.date - a.date) }; emit() },
  deleteEntry(id: string) { state = { ...state, entries: state.entries.filter((entry) => entry.id !== id) }; emit() },
  updateSettings(startWeight: number, targetWeight: number) { state = { ...state, startWeight, targetWeight }; emit() },
}
