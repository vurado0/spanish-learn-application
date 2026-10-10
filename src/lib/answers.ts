import type { VAnswers, Variant } from '../types'

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** lowercase, remove punctuation and extra spaces */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[¿?¡!.,;:"“”«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface CheckResult {
  correct: boolean
  /** which variant the answer matched (both = identical in both variants) */
  variant?: Variant | 'both'
  /** correct but accents were missing/wrong */
  accentWarning?: boolean
  /** the expected answer to show on a mistake / accent warning */
  expected: string
}

export function checkAnswer(input: string, answers: VAnswers, preferred: Variant = 'latam'): CheckResult {
  const latam = answers.latam
  const spain = answers.spain ?? answers.latam
  const n = normalize(input)
  const na = stripAccents(n)

  const exact = (list: string[]) => list.find((a) => normalize(a) === n)
  const loose = (list: string[]) => list.find((a) => stripAccents(normalize(a)) === na)

  const variantOf = (inLatam: boolean, inSpain: boolean): Variant | 'both' =>
    inLatam && inSpain ? 'both' : inLatam ? 'latam' : 'spain'

  const eL = exact(latam), eS = exact(spain)
  if (eL || eS) return { correct: true, variant: variantOf(!!eL, !!eS), expected: (eL ?? eS)! }

  const lL = loose(latam), lS = loose(spain)
  if (lL || lS) return { correct: true, variant: variantOf(!!lL, !!lS), accentWarning: true, expected: (lL ?? lS)! }

  return { correct: false, expected: (preferred === 'spain' ? spain : latam)[0] }
}

export function variantLabel(v?: Variant | 'both'): string {
  if (v === 'latam') return 'Latin American version 🌎'
  if (v === 'spain') return 'Spain version 🇪🇸'
  return ''
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** pick the text for a variant from a VText-like object */
export function pick(t: { latam: string; spain?: string }, v: Variant): string {
  return v === 'spain' ? t.spain ?? t.latam : t.latam
}
