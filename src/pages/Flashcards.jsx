import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import { incrementTodayExercises, addMemorizedWord, getUserId } from '../utils/storage'
import AuthModal from '../components/AuthModal'
import './Flashcards.css'

const MODES = {
  GREEK_TO_ENGLISH: 'greek-to-english',
  ENGLISH_TO_GREEK: 'english-to-greek',
  MULTIPLE_CHOICE: 'multiple-choice'
}

const Flashcards = ({ isActive = false }) => {
  const [mode, setMode] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Show auth modal only when page is active and user is not authenticated
    if (isActive) {
      const userId = getUserId()
      if (!userId || userId.startsWith('user_')) {
        setShowAuthModal(true)
      }
    } else {
      // Hide modal when page is not active
      setShowAuthModal(false)
    }
  }, [isActive])

  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * dictionaryData.length)
    return dictionaryData[randomIndex]
  }

  const getRandomWords = (count, excludeWord) => {
    const words = [...dictionaryData]
    const shuffled = words.sort(() => 0.5 - Math.random())
    return shuffled
      .filter((w) => w.greek !== excludeWord.greek)
      .slice(0, count)
      .map((w) => w.english)
  }

  const startMode = (selectedMode) => {
    setMode(selectedMode)
    setShowTranslation(false)
    setSelectedAnswer(null)
    setIsCorrect(null)
    const word = getRandomWord()
    setCurrentWord(word)

    if (selectedMode === MODES.MULTIPLE_CHOICE) {
      const wrongAnswers = getRandomWords(2, word)
      const options = [word.english, ...wrongAnswers].sort(() => 0.5 - Math.random())
      setMultipleChoiceOptions(options)
    }
  }

  const handleCardClick = async () => {
    if (mode === MODES.MULTIPLE_CHOICE) return

    if (!showTranslation) {
      setShowTranslation(true)
      await incrementTodayExercises()
    } else {
      // Move to next word (don't count as new exercise yet)
      const word = getRandomWord()
      setCurrentWord(word)
      setShowTranslation(false)
    }
  }

  const handleAnswerClick = async (answer) => {
    if (selectedAnswer !== null) return // Already answered

    setSelectedAnswer(answer)
    const correct = answer === currentWord.english
    setIsCorrect(correct)
    await incrementTodayExercises()

    if (correct) {
      await addMemorizedWord(currentWord.greek)
    }
  }

  const handleNextQuestion = () => {
    const word = getRandomWord()
    setCurrentWord(word)
    setShowTranslation(false)
    setSelectedAnswer(null)
    setIsCorrect(null)
    const wrongAnswers = getRandomWords(2, word)
    const options = [word.english, ...wrongAnswers].sort(() => 0.5 - Math.random())
    setMultipleChoiceOptions(options)
  }

  if (!mode) {
    return (
      <div className="flashcards">
        <h1 className="page-title">Flashcards</h1>
        <div className="mode-selection">
          <h2 className="mode-selection-title">Choose a game mode:</h2>
          <div className="mode-cards">
            <div
              className="mode-card"
              onClick={() => startMode(MODES.GREEK_TO_ENGLISH)}
            >
              <h3>Greek → English</h3>
              <p>See the Greek word and guess the translation</p>
            </div>
            <div
              className="mode-card"
              onClick={() => startMode(MODES.ENGLISH_TO_GREEK)}
            >
              <h3>English → Greek</h3>
              <p>See the translation and remember the Greek word</p>
            </div>
            <div
              className="mode-card"
              onClick={() => startMode(MODES.MULTIPLE_CHOICE)}
            >
              <h3>Multiple Choice</h3>
              <p>Choose the correct translation from three options</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flashcards">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {mode === MODES.MULTIPLE_CHOICE ? (
        <div className="multiple-choice-card">
          <div className="question-word">{currentWord.greek}</div>
          <div className="options-list">
            {multipleChoiceOptions.map((option, index) => (
              <button
                key={index}
                className={`option-button ${
                  selectedAnswer === option
                    ? isCorrect
                      ? 'correct'
                      : 'incorrect'
                    : selectedAnswer !== null && option === currentWord.english
                    ? 'correct-answer'
                    : ''
                }`}
                onClick={() => handleAnswerClick(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            ))}
          </div>
          {selectedAnswer !== null && (
            <button className="next-button" onClick={handleNextQuestion}>
              Next Question →
            </button>
          )}
        </div>
      ) : (
        <div className="flashcard" onClick={handleCardClick}>
          <div className="flashcard-content">
            {mode === MODES.GREEK_TO_ENGLISH ? (
              <>
                <div className="flashcard-main">{currentWord.greek}</div>
                {showTranslation && (
                  <div className="flashcard-translation">
                    {currentWord.english}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flashcard-main">{currentWord.english}</div>
                {showTranslation && (
                  <div className="flashcard-translation">
                    {currentWord.greek}
                  </div>
                )}
              </>
            )}
            {!showTranslation && (
              <div className="flashcard-hint">Tap to reveal translation</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Flashcards

