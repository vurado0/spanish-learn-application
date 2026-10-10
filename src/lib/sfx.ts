/**
 * Sound effects synthesised with the Web Audio API – no audio files, no services.
 * The AudioContext is created lazily on the first sound (always after a user tap).
 */
let ctx: AudioContext | null = null
let enabled = true

export function setSfxEnabled(on: boolean) {
  enabled = on
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** one note with a quick attack and a soft exponential release */
function note(freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.14) {
  const c = audio()
  if (!c) return
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

const semitone = (base: number, n: number) => base * Math.pow(2, n / 12)

export const sfx = {
  /** bright two-note chime; climbs a little with every answer in a row */
  correct(combo = 1) {
    const base = semitone(659.25, Math.min(combo - 1, 8)) // E5 upwards
    note(base, 0, 0.16, 'triangle', 0.12)
    note(semitone(base, 7), 0.08, 0.28, 'triangle', 0.12)
  },
  /** soft, low “nope” – not punishing */
  wrong() {
    note(233.08, 0, 0.16, 'sine', 0.13)
    note(196, 0.11, 0.3, 'sine', 0.11)
  },
  /** quick arpeggio for combo milestones */
  combo(level = 1) {
    const base = semitone(523.25, Math.min(level, 4) * 2)
    ;[0, 4, 7, 12].forEach((n, i) => note(semitone(base, n), i * 0.07, 0.22, 'triangle', 0.1))
  },
  /** matched pair in the memory game */
  match() {
    note(880, 0, 0.1, 'sine', 0.09)
    note(1318.5, 0.06, 0.18, 'sine', 0.08)
  },
  /** card flip / tap */
  flip() {
    note(1046.5, 0, 0.05, 'square', 0.025)
  },
  /** lesson / session complete fanfare */
  complete() {
    const seq: [number, number, number][] = [
      [523.25, 0, 0.18], // C5
      [659.25, 0.14, 0.18], // E5
      [783.99, 0.28, 0.18], // G5
      [1046.5, 0.42, 0.5], // C6
    ]
    seq.forEach(([f, at, d]) => note(f, at, d, 'triangle', 0.13))
    note(523.25, 0.42, 0.6, 'sine', 0.07)
    note(659.25, 0.42, 0.6, 'sine', 0.06)
  },
  /** new badge / streak extended sparkle */
  sparkle() {
    ;[0, 3, 7, 12, 16].forEach((n, i) => note(semitone(1046.5, n), i * 0.06, 0.25, 'sine', 0.06))
  },
}
