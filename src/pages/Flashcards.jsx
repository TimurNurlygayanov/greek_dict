import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import { incrementTodayExercises, addMemorizedWord } from '../utils/storage'
import './Flashcards.css'

const MODES = {
  GREEK_TO_ENGLISH: 'greek-to-english',
  ENGLISH_TO_GREEK: 'english-to-greek',
  MULTIPLE_CHOICE: 'multiple-choice'
}

const Flashcards = () => {
  const [mode, setMode] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)

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

  const handleCardClick = () => {
    if (mode === MODES.MULTIPLE_CHOICE) return

    if (!showTranslation) {
      setShowTranslation(true)
      incrementTodayExercises()
    } else {
      // Move to next word (don't count as new exercise yet)
      const word = getRandomWord()
      setCurrentWord(word)
      setShowTranslation(false)
    }
  }

  const handleAnswerClick = (answer) => {
    if (selectedAnswer !== null) return // Already answered

    setSelectedAnswer(answer)
    const correct = answer === currentWord.english
    setIsCorrect(correct)
    incrementTodayExercises()

    if (correct) {
      addMemorizedWord(currentWord.greek)
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
      <div className="flashcards-header">
        <button className="back-button" onClick={() => setMode(null)}>
          ← Back to modes
        </button>
        <h1 className="page-title">
          {mode === MODES.GREEK_TO_ENGLISH && 'Greek → English'}
          {mode === MODES.ENGLISH_TO_GREEK && 'English → Greek'}
          {mode === MODES.MULTIPLE_CHOICE && 'Multiple Choice'}
        </h1>
      </div>

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

