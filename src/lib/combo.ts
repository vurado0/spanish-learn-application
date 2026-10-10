import { useSyncExternalStore } from 'react'
import { sfx } from './sfx'

/**
 * Answers-in-a-row tracker shared by lessons and vocabulary sessions.
 * Every answered question calls registerAnswer(); a wrong answer resets the combo.
 */
export const COMBO_MILESTONES = [3, 5, 10, 15, 20, 30]

interface ComboState {
  current: number
  best: number
  /** last milestone reached – increments `seq` so the toast re-triggers */
  milestone: number
  seq: number
}

let state: ComboState = { current: 0, best: 0, milestone: 0, seq: 0 }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function resetCombo() {
  state = { current: 0, best: 0, milestone: 0, seq: state.seq }
  emit()
}

/** plays the right sound and returns the new combo */
export function registerAnswer(correct: boolean): number {
  if (!correct) {
    state = { ...state, current: 0 }
    sfx.wrong()
    emit()
    return 0
  }
  const current = state.current + 1
  const hit = COMBO_MILESTONES.includes(current)
  state = { current, best: Math.max(state.best, current), milestone: hit ? current : state.milestone, seq: hit ? state.seq + 1 : state.seq }
  sfx.correct(current)
  if (hit) setTimeout(() => sfx.combo(COMBO_MILESTONES.indexOf(current)), 260)
  emit()
  return current
}

export const getCombo = () => state

export function useCombo(): ComboState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
