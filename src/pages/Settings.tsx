import { useState, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useData } from '../context/DataContext'
import { getReminder, notificationsSupported, setReminder, type ReminderSettings } from '../lib/reminder'
import { hasExactVoice, speak } from '../lib/speech'
import Card from '../components/Card'

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-stone-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-semibold text-stone-900">{title}</div>
        {desc && <div className="text-sm text-stone-500">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full bg-stone-100 p-1 text-sm font-medium">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={`rounded-full px-3 py-1.5 ${value === o.value ? 'bg-white shadow' : 'text-stone-500'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings, profile } = useData()
  const navigate = useNavigate()
  const [reminder, setRem] = useState<ReminderSettings>(getReminder())
  const [notifMsg, setNotifMsg] = useState('')

  const saveReminder = async (r: ReminderSettings) => {
    if (r.enabled && notificationsSupported() && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission()
      if (p !== 'granted') {
        setNotifMsg('Notifications are blocked in this browser. Allow them in the site settings to use reminders.')
        r = { ...r, enabled: false }
      }
    }
    setRem(r)
    setReminder(r)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-stone-900">Settings</h1>
      <Card>
        <Row title="Show English explanations" desc="Hide them to push yourself – Spanish explanations are shown where available.">
          <Segmented value={settings.showEnglish ? 'on' : 'off'} options={[{ value: 'on', label: 'Show' }, { value: 'off', label: 'Hide' }]} onChange={(v) => updateSettings({ showEnglish: v === 'on' })} />
        </Row>
        <Row title="Default variant in dialogues" desc="Alcalá/Madrid scenes always start in the Spain version.">
          <Segmented value={settings.defaultVariant} options={[{ value: 'latam', label: '🌎 Latin America' }, { value: 'spain', label: '🇪🇸 Spain' }]} onChange={(v) => updateSettings({ defaultVariant: v })} />
        </Row>
        <Row title="Audio speed">
          <div className="flex items-center gap-2">
            <Segmented value={settings.audioSpeed} options={[{ value: 'normal', label: 'Normal' }, { value: 'slow', label: '🐢 Slow' }]} onChange={(v) => updateSettings({ audioSpeed: v })} />
            <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-sm" onClick={() => speak('Hola, ¿qué tal? Muchas gracias.', settings.defaultVariant, settings.audioSpeed)}>🔊 Test</button>
          </div>
        </Row>
        <Row
          title="Voices on this device"
          desc={`🌎 ${hasExactVoice('latam') ? 'Latin American voice found' : 'no es-MX/es-US voice – using another Spanish voice'} · 🇪🇸 ${hasExactVoice('spain') ? 'Spain voice found' : 'no es-ES voice – using another Spanish voice'}`}
        >
          <span className="text-xs text-stone-400">Install more in your OS speech settings</span>
        </Row>
        <Row title="Daily reminder" desc="Browser notification if you haven't practised yet (works while a Charla tab is open).">
          {notificationsSupported() ? (
            <div className="flex items-center gap-2">
              <input type="time" value={reminder.time} onChange={(e) => saveReminder({ ...reminder, time: e.target.value })} className="rounded-lg border border-stone-300 px-2 py-1" />
              <Segmented value={reminder.enabled ? 'on' : 'off'} options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} onChange={(v) => saveReminder({ ...reminder, enabled: v === 'on' })} />
            </div>
          ) : (
            <span className="text-sm text-stone-400">Not supported in this browser</span>
          )}
        </Row>
        {notifMsg && <p className="text-sm text-red-700">{notifMsg}</p>}
      </Card>

      <Card>
        <Row title="Placement check" desc={profile?.placementResult ? `Last result: ${profile.placementResult.score}/${profile.placementResult.total}` : undefined}>
          <Link to="/placement" className="btn-secondary py-2">Retake</Link>
        </Row>
        <Row title="Account" desc={profile?.email}>
          <button type="button" className="btn-secondary py-2" onClick={async () => { await signOut(auth); navigate('/login') }}>Log out</button>
        </Row>
      </Card>
    </div>
  )
}
