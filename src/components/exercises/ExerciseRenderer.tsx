import type { Exercise, Variant } from '../../types'
import MultipleChoice from './MultipleChoice'
import FillGap from './FillGap'
import MatchPairs from './MatchPairs'
import SentenceBuilder from './SentenceBuilder'
import Listening from './Listening'
import DialogueChoice from './DialogueChoice'
import VariantSort from './VariantSort'

export default function ExerciseRenderer({ exercise, variant, onDone }: { exercise: Exercise; variant: Variant; onDone: (correct: boolean) => void }) {
  switch (exercise.type) {
    case 'mc':
      return <MultipleChoice exercise={exercise} variant={variant} onDone={onDone} />
    case 'gap':
      return <FillGap exercise={exercise} variant={variant} onDone={onDone} />
    case 'match':
      return <MatchPairs exercise={exercise} variant={variant} onDone={onDone} />
    case 'build':
      return <SentenceBuilder exercise={exercise} variant={variant} onDone={onDone} />
    case 'listen':
      return <Listening exercise={exercise} variant={variant} onDone={onDone} />
    case 'dialogue':
      return <DialogueChoice exercise={exercise} variant={variant} onDone={onDone} />
    case 'sort':
      return <VariantSort exercise={exercise} variant={variant} onDone={onDone} />
  }
}
