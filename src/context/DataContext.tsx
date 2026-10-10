import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import type { LessonProgress, PlacementResult, Settings, Stats, UserDoc, VocabProgress } from '../types'
import { addDays, todayKey, weekKey } from '../lib/dates'
import { findLesson, nextLessonId, units, allLessons } from '../lib/content'
import { newVocab, review } from '../lib/srs'

export const DEFAULT_SETTINGS: Settings = { showEnglish: true, defaultVariant: 'latam', audioSpeed: 'normal' }

const firstLesson = allLessons[0]?.id ?? ''

const DEFAULT_STATS: Stats = {
  currentUnit: units[0]?.id ?? '',
  currentLesson: firstLesson,
  streak: 0,
  lastActiveDate: '',
  weeklyMinutes: { week: weekKey(), minutes: 0 },
  badges: [],
}

interface DataState {
  ready: boolean
  profile: UserDoc | null
  settings: Settings
  stats: Stats
  progress: Record<string, LessonProgress>
  vocab: Record<string, VocabProgress>
  updateSettings: (s: Partial<Settings>) => void
  savePlacement: (r: PlacementResult) => void
  saveExerciseProgress: (lessonId: string, inProgress: NonNullable<LessonProgress['inProgress']>, minutes: number) => void
  completeLesson: (lessonId: string, scorePercent: number, minutes: number) => { newBadge?: string }
  reviewWord: (wordId: string, correct: boolean, minutes: number) => void
}

const DataContext = createContext<DataState | null>(null)

/** Firestore writes resolve only after the server acknowledges them, so we never await
 *  them — with offline persistence the local cache updates instantly and syncs later. */
const fire = (p: Promise<unknown>) => p.catch((e) => console.error('Firestore write failed', e))

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({})
  const [vocab, setVocab] = useState<Record<string, VocabProgress>>({})
  const [loaded, setLoaded] = useState({ profile: false, stats: false, progress: false, vocab: false })

  // refs so the action callbacks always see the latest data
  const statsRef = useRef(stats)
  statsRef.current = stats
  const progressRef = useRef(progress)
  progressRef.current = progress
  const vocabRef = useRef(vocab)
  vocabRef.current = vocab

  useEffect(() => {
    if (!uid || !user) return
    setLoaded({ profile: false, stats: false, progress: false, vocab: false })
    const userRef = doc(db, 'users', uid)

    const unsubs = [
      onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
          // first sign-in: create the user document
          if (snap.metadata.fromCache) return // wait for the server before deciding it doesn't exist
          const fresh: UserDoc = {
            displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Learner',
            email: user.email ?? '',
            createdAt: Date.now(),
            settings: DEFAULT_SETTINGS,
            placementResult: null,
          }
          fire(setDoc(userRef, fresh))
          setProfile(fresh)
        } else {
          const data = snap.data() as UserDoc
          setProfile({ ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } })
        }
        setLoaded((l) => ({ ...l, profile: true }))
      }),
      onSnapshot(doc(db, 'users', uid, 'stats', 'summary'), (snap) => {
        setStats(snap.exists() ? { ...DEFAULT_STATS, ...(snap.data() as Stats) } : DEFAULT_STATS)
        setLoaded((l) => ({ ...l, stats: true }))
      }),
      onSnapshot(collection(db, 'users', uid, 'progress'), (snap) => {
        const p: Record<string, LessonProgress> = {}
        snap.forEach((d) => (p[d.id] = d.data() as LessonProgress))
        setProgress(p)
        setLoaded((l) => ({ ...l, progress: true }))
      }),
      onSnapshot(collection(db, 'users', uid, 'vocab'), (snap) => {
        const v: Record<string, VocabProgress> = {}
        snap.forEach((d) => (v[d.id] = d.data() as VocabProgress))
        setVocab(v)
        setLoaded((l) => ({ ...l, vocab: true }))
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [uid, user])

  const settings = profile?.settings ?? DEFAULT_SETTINGS

  /** streak + weekly minutes bookkeeping, merged into a stats patch */
  const activityPatch = useCallback((minutes: number): Partial<Stats> => {
    const s = statsRef.current
    const today = todayKey()
    let streak = s.streak
    if (s.lastActiveDate !== today) streak = s.lastActiveDate === addDays(today, -1) ? s.streak + 1 : 1
    const week = weekKey()
    const prev = s.weeklyMinutes?.week === week ? s.weeklyMinutes.minutes : 0
    return {
      streak,
      lastActiveDate: today,
      weeklyMinutes: { week, minutes: Math.round((prev + minutes) * 10) / 10 },
    }
  }, [])

  const writeStats = useCallback(
    (patch: Partial<Stats>) => {
      if (!uid) return
      const next = { ...statsRef.current, ...patch }
      statsRef.current = next
      setStats(next)
      fire(setDoc(doc(db, 'users', uid, 'stats', 'summary'), next, { merge: true }))
    },
    [uid],
  )

  const writeProgress = useCallback(
    (lessonId: string, patch: Partial<LessonProgress>) => {
      if (!uid) return
      const prev = progressRef.current[lessonId] ?? { completed: false, bestScore: 0, attempts: 0, lastPlayedAt: 0 }
      const next = { ...prev, ...patch }
      progressRef.current = { ...progressRef.current, [lessonId]: next }
      setProgress(progressRef.current)
      fire(setDoc(doc(db, 'users', uid, 'progress', lessonId), next, { merge: true }))
    },
    [uid],
  )

  const updateSettings = useCallback(
    (s: Partial<Settings>) => {
      if (!uid) return
      const next = { ...settings, ...s }
      setProfile((p) => (p ? { ...p, settings: next } : p))
      fire(setDoc(doc(db, 'users', uid), { settings: next }, { merge: true }))
    },
    [uid, settings],
  )

  const savePlacement = useCallback(
    (r: PlacementResult) => {
      if (!uid) return
      setProfile((p) => (p ? { ...p, placementResult: r } : p))
      fire(setDoc(doc(db, 'users', uid), { placementResult: r }, { merge: true }))
      writeStats({ currentLesson: r.startLessonId, currentUnit: findLesson(r.startLessonId)?.unit.id ?? DEFAULT_STATS.currentUnit })
    },
    [uid, writeStats],
  )

  const saveExerciseProgress = useCallback<DataState['saveExerciseProgress']>(
    (lessonId, inProgress, minutes) => {
      writeProgress(lessonId, { inProgress, lastPlayedAt: Date.now() })
      writeStats({ ...activityPatch(minutes), currentLesson: lessonId, currentUnit: findLesson(lessonId)?.unit.id ?? '' })
    },
    [writeProgress, writeStats, activityPatch],
  )

  const completeLesson = useCallback<DataState['completeLesson']>(
    (lessonId, scorePercent, minutes) => {
      if (!uid) return {}
      const prev = progressRef.current[lessonId]
      writeProgress(lessonId, {
        completed: true,
        bestScore: Math.max(prev?.bestScore ?? 0, scorePercent),
        attempts: (prev?.attempts ?? 0) + 1,
        lastPlayedAt: Date.now(),
        inProgress: null,
      })

      // add the lesson's words to the spaced-repetition deck (due tomorrow)
      const found = findLesson(lessonId)
      found?.lesson.vocab.forEach((w) => {
        if (vocabRef.current[w.id]) return
        const v = { ...newVocab(), dueDate: addDays(todayKey(), 1) }
        vocabRef.current = { ...vocabRef.current, [w.id]: v }
        fire(setDoc(doc(db, 'users', uid, 'vocab', w.id), v))
      })
      setVocab(vocabRef.current)

      // unit badge
      let newBadge: string | undefined
      const badges = [...(statsRef.current.badges ?? [])]
      if (found) {
        const unitDone = found.unit.lessons.every((l) => progressRef.current[l.id]?.completed)
        if (unitDone && !badges.includes(found.unit.badge.id)) {
          badges.push(found.unit.badge.id)
          newBadge = found.unit.badge.id
        }
      }

      const next = nextLessonId(lessonId) ?? lessonId
      writeStats({
        ...activityPatch(minutes),
        badges,
        currentLesson: next,
        currentUnit: findLesson(next)?.unit.id ?? '',
      })
      return { newBadge }
    },
    [uid, writeProgress, writeStats, activityPatch],
  )

  const reviewWord = useCallback<DataState['reviewWord']>(
    (wordId, correct, minutes) => {
      if (!uid) return
      const v = review(vocabRef.current[wordId] ?? newVocab(), correct)
      vocabRef.current = { ...vocabRef.current, [wordId]: v }
      setVocab(vocabRef.current)
      fire(setDoc(doc(db, 'users', uid, 'vocab', wordId), v))
      writeStats(activityPatch(minutes))
    },
    [uid, writeStats, activityPatch],
  )

  const value = useMemo<DataState>(
    () => ({
      ready: loaded.profile && loaded.stats && loaded.progress && loaded.vocab,
      profile,
      settings,
      stats,
      progress,
      vocab,
      updateSettings,
      savePlacement,
      saveExerciseProgress,
      completeLesson,
      reviewWord,
    }),
    [loaded, profile, settings, stats, progress, vocab, updateSettings, savePlacement, saveExerciseProgress, completeLesson, reviewWord],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}

/** streak as displayed: it's broken if the last active day was before yesterday */
export function displayStreak(stats: Stats): number {
  const today = todayKey()
  return stats.lastActiveDate === today || stats.lastActiveDate === addDays(today, -1) ? stats.streak : 0
}
