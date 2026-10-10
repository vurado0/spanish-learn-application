import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth, firebaseConfigured, googleProvider } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

type Mode = 'login' | 'register' | 'reset'

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is wrong.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-not-found': 'No account with that email.',
  'auth/wrong-password': 'Email or password is wrong.',
  'auth/email-already-in-use': 'An account with this email already exists – try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/unauthorized-domain':
    'This domain is not authorised for sign-in. Add it in Firebase → Authentication → Settings → Authorized domains.',
  'auth/popup-closed-by-user': 'The Google window was closed before signing in.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
}

const errorText = (e: unknown) =>
  e instanceof FirebaseError ? MESSAGES[e.code] ?? e.message : 'Something went wrong. Please try again.'

export function AuthPage({ mode }: { mode: Mode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to={from} replace />

  async function run(fn: () => Promise<void>) {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        navigate(from, { replace: true })
      } else if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
        navigate('/placement', { replace: true })
      } else {
        await sendPasswordResetEmail(auth, email)
        setInfo('Check your inbox – we sent you a link to reset your password.')
      }
    })
  }

  const google = () =>
    run(async () => {
      try {
        await signInWithPopup(auth, googleProvider)
        navigate(from, { replace: true })
      } catch (e) {
        // popups are often blocked on mobile browsers → fall back to a full-page redirect
        if (e instanceof FirebaseError && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
          await signInWithRedirect(auth, googleProvider)
        } else throw e
      }
    })

  const title = { login: '¡Hola de nuevo!', register: 'Create your account', reset: 'Reset your password' }[mode]
  const subtitle = {
    login: 'Sign in to continue your conversations.',
    register: 'Your progress is saved to your account – phone and laptop stay in sync.',
    reset: "Enter your email and we'll send you a reset link.",
  }[mode]

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-orange-50 via-stone-50 to-emerald-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/favicon.svg" alt="" className="mx-auto mb-3 h-14 w-14" />
          <h1 className="text-2xl font-extrabold text-stone-900">{title}</h1>
          <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
        </div>

        {!firebaseConfigured && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill in your project's keys (see README).
          </div>
        )}

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                onClick={google}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white py-3 font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60"
              >
                <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
                </svg>
                Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
                <div className="h-px flex-1 bg-stone-200" /> or with email <div className="h-px flex-1 bg-stone-200" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'register' && (
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="input" />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="input" />
            </label>
            {mode !== 'reset' && (
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="input"
                />
              </label>
            )}

            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            {info && <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">{info}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? '…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-4 space-y-1 text-center text-sm">
            {mode === 'login' && (
              <>
                <p>
                  <Link to="/reset-password" className="text-orange-700 hover:underline">Forgot your password?</Link>
                </p>
                <p className="text-stone-600">
                  New here? <Link to="/register" className="font-semibold text-orange-700 hover:underline">Create an account</Link>
                </p>
              </>
            )}
            {mode !== 'login' && (
              <p className="text-stone-600">
                <Link to="/login" className="font-semibold text-orange-700 hover:underline">← Back to sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
