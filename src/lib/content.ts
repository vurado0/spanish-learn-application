import type { Lesson, PlacementTest, Unit, VocabItem } from '../types'
import placementJson from '../content/placement.json'

// Every JSON file in src/content/units becomes a unit — adding a unit = adding a file.
const unitModules = import.meta.glob<Unit>('../content/units/*.json', { eager: true, import: 'default' })

export const units: Unit[] = Object.values(unitModules).sort((a, b) => a.order - b.order)

export const placement = placementJson as PlacementTest

export const allLessons: Lesson[] = units.flatMap((u) => u.lessons)

const lessonIndex = new Map<string, { unit: Unit; lesson: Lesson; index: number }>()
units.forEach((unit) => unit.lessons.forEach((lesson, index) => lessonIndex.set(lesson.id, { unit, lesson, index })))

export function findLesson(id: string) {
  return lessonIndex.get(id)
}

export function nextLessonId(id: string): string | undefined {
  const i = allLessons.findIndex((l) => l.id === id)
  return i >= 0 ? allLessons[i + 1]?.id : undefined
}

/** every vocabulary item in the course, by id */
export const vocabIndex = new Map<string, VocabItem & { lessonId: string }>()
allLessons.forEach((l) => l.vocab.forEach((v) => vocabIndex.set(v.id, { ...v, lessonId: l.id })))
