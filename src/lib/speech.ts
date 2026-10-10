import type { Variant } from '../types'

const LATAM_LANGS = ['es-MX', 'es-US', 'es-419', 'es-CO', 'es-AR', 'es-CL', 'es-PE', 'es-VE']
const SPAIN_LANGS = ['es-ES']

let voices: SpeechSynthesisVoice[] = []

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

const norm = (l: string) => l.replace('_', '-').toLowerCase()

/** es-MX / es-US for Latin America, es-ES for Spain, else any Spanish voice */
export function pickVoice(variant: Variant): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices()
  const wanted = variant === 'spain' ? SPAIN_LANGS : LATAM_LANGS
  for (const lang of wanted) {
    const matches = voices.filter((v) => norm(v.lang) === lang.toLowerCase())
    if (matches.length) return matches.find((v) => v.localService) ?? matches[0]
  }
  return voices.find((v) => norm(v.lang).startsWith('es'))
}

/** true when the device has a voice for exactly this variant (not just a fallback) */
export function hasExactVoice(variant: Variant): boolean {
  const v = pickVoice(variant)
  if (!v) return false
  const wanted = variant === 'spain' ? SPAIN_LANGS : LATAM_LANGS
  return wanted.map((l) => l.toLowerCase()).includes(norm(v.lang))
}

export function speak(text: string, variant: Variant, speed: 'normal' | 'slow' = 'normal'): void {
  if (!speechSupported()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(variant)
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? (variant === 'spain' ? 'es-ES' : 'es-MX')
  u.rate = speed === 'slow' ? 0.7 : 0.95
  synth.speak(u)
}
