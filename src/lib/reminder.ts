import { useEffect } from 'react'
import { todayKey } from './dates'

/**
 * Optional browser reminder. Stored per device (localStorage) because notification
 * permission is per browser. Without a push server (free tier!) we can only notify
 * while a Charla tab is open in the background, so the check runs every minute.
 */
const KEY = 'charla.reminder'

export interface ReminderSettings {
  enabled: boolean
  time: string // HH:MM
}

export function getReminder(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable */
  }
  return { enabled: false, time: '19:00' }
}

export function setReminder(r: ReminderSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* ignore */
  }
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export function useReminder(lastActiveDate: string) {
  useEffect(() => {
    if (!notificationsSupported()) return
    const check = () => {
      const r = getReminder()
      if (!r.enabled || Notification.permission !== 'granted') return
      const today = todayKey()
      if (lastActiveDate === today) return
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      let shown = ''
      try {
        shown = localStorage.getItem(KEY + '.shown') ?? ''
      } catch {
        /* ignore */
      }
      if (hhmm >= r.time && shown !== today) {
        new Notification('¡Hola! Time for Spanish 🇪🇸🌎', {
          body: 'A 10-minute lesson keeps your streak alive. ¡Vamos!',
          icon: '/favicon.svg',
        })
        try {
          localStorage.setItem(KEY + '.shown', today)
        } catch {
          /* ignore */
        }
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [lastActiveDate])
}
