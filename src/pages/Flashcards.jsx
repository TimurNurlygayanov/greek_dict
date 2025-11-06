import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import { incrementTodayExercises, getUserId } from '../utils/storage'
import { getUserLists, markWordAsLearned } from '../utils/wordLists'
import AuthModal from '../components/AuthModal'
import './Flashcards.css'

const MODES = {
  GREEK_TO_ENGLISH: 'greek-to-english',
  ENGLISH_TO_GREEK: 'english-to-greek',
  MULTIPLE_CHOICE: 'multiple-choice'
}

const Flashcards = () => {
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [mode, setMode] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Show auth modal when component mounts if not authenticated
    const userId = getUserId()
    if (!userId || userId.startsWith('user_')) {
      setShowAuthModal(true)
    } else {
      loadLists()
    }
  }, [])

  // Reload lists when auth modal is closed (user might have authenticated)
  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    const userId = getUserId()
    if (userId && !userId.startsWith('user_')) {
      loadLists()
    }
  }

  const loadLists = async () => {
    const userLists = await getUserLists()
    // Show all lists, including default ones
    setLists(userLists.filter(list => list.words.length > 0 || list.isDefault))
  }

  // Get available words (excluding learned ones)
  const getAvailableWords = () => {
    if (!selectedList) return []
    return selectedList.words.filter(
      word => !selectedList.learnedWords.includes(word.greek)
    )
  }

  const getRandomWord = () => {
    const availableWords = getAvailableWords()
    if (availableWords.length === 0) return null
    const randomIndex = Math.floor(Math.random() * availableWords.length)
    return availableWords[randomIndex]
  }

  const getRandomWords = (count, excludeWord) => {
    const availableWords = getAvailableWords()
    let shuffled = [...availableWords]
      .sort(() => 0.5 - Math.random())
      .filter((w) => w.greek !== excludeWord.greek)
      .slice(0, count)
      .map((w) => w.english)
    
    // If not enough words in list, fill with random from dictionary
    if (shuffled.length < count) {
      const fromDictionary = [...dictionaryData]
        .sort(() => 0.5 - Math.random())
        .filter((w) => w.greek !== excludeWord.greek && !shuffled.includes(w.english))
        .slice(0, count - shuffled.length)
        .map((w) => w.english)
      shuffled = [...shuffled, ...fromDictionary]
    }
    return shuffled
  }

  const handleListSelect = (list) => {
    setSelectedList(list)
    setMode(null)
    setCurrentWord(null)
  }

  const startMode = (selectedMode) => {
    setMode(selectedMode)
    setShowTranslation(false)
    setSelectedAnswer(null)
    setIsCorrect(null)
    const word = getRandomWord()
    if (!word) {
      alert('No words available in this list!')
      return
    }
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
      // Move to next word
      const word = getRandomWord()
      if (!word) {
        alert('No more words available!')
        return
      }
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
  }

  const handleNextQuestion = () => {
    const word = getRandomWord()
    if (!word) {
      alert('No more words available!')
      return
    }
    setCurrentWord(word)
    setShowTranslation(false)
    setSelectedAnswer(null)
    setIsCorrect(null)
    const wrongAnswers = getRandomWords(2, word)
    const options = [word.english, ...wrongAnswers].sort(() => 0.5 - Math.random())
    setMultipleChoiceOptions(options)
  }

  const handleMarkAsLearned = async () => {
    if (!selectedList || !currentWord) return
    
    try {
      await markWordAsLearned(selectedList.id, currentWord.greek)
      // Update selected list locally
      const updatedList = {
        ...selectedList,
        learnedWords: [...selectedList.learnedWords, currentWord.greek]
      }
      setSelectedList(updatedList)
      // Reload lists to sync
      await loadLists()
      // Move to next word
      const word = getRandomWord()
      if (!word) {
        alert('No more words available!')
        setCurrentWord(null)
        return
      }
      setCurrentWord(word)
      setShowTranslation(false)
      setSelectedAnswer(null)
      setIsCorrect(null)
    } catch (error) {
      console.error('Error marking word as learned:', error)
    }
  }

  // Show list selection
  if (!selectedList) {
    return (
      <div className="flashcards">
        {showAuthModal && <AuthModal onClose={handleAuthModalClose} />}
        <h1 className="page-title">Flashcards</h1>
        <div className="list-selection">
          <h2 className="list-selection-title">Choose a word list:</h2>
          {lists.length === 0 ? (
            <div className="no-lists-message">
              <p>You don't have any word lists yet.</p>
              <p>Go to Dictionary and add words to lists to start practicing!</p>
            </div>
          ) : (
            <div className="lists-grid">
              {lists.map((list) => {
                const availableCount = list.words.filter(
                  w => !list.learnedWords.includes(w.greek)
                ).length
                const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
                return (
                  <div
                    key={list.id}
                    className={`list-card ${isDefault ? 'default-list' : ''}`}
                    onClick={() => handleListSelect(list)}
                  >
                    {isDefault && <span className="default-badge">Default</span>}
                    <h3 className="list-card-name">{list.name}</h3>
                    <div className="list-card-stats">
                      <span>{availableCount} words to learn</span>
                      <span>{list.words.length} total words</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show mode selection
  if (!mode) {
    const availableWords = getAvailableWords()
    if (availableWords.length === 0) {
      return (
        <div className="flashcards">
          <button className="back-button" onClick={() => setSelectedList(null)}>
            ← Back to lists
          </button>
          <div className="no-words-message">
            <h2>All words in this list are learned!</h2>
            <p>Great job! You've mastered all words in "{selectedList.name}"</p>
            <button className="back-to-lists-button" onClick={() => setSelectedList(null)}>
              Choose Another List
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flashcards">
        <button className="back-button" onClick={() => setSelectedList(null)}>
          ← Back to lists
        </button>
        <div className="mode-selection">
          <h2 className="mode-selection-title">Choose a game mode:</h2>
          <p className="list-info">Playing with: {selectedList.name} ({getAvailableWords().length} words)</p>
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

  // Show game
  if (!currentWord) {
    return (
      <div className="flashcards">
        <button className="back-button" onClick={() => setMode(null)}>
          ← Back to modes
        </button>
        <div className="no-words-message">
          <h2>No words available!</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flashcards">
      <div className="flashcard-header">
        <button className="back-button" onClick={() => setMode(null)}>
          ← Back to modes
        </button>
        <div className="flashcard-info">
          {selectedList.name} • {getAvailableWords().length} words left
        </div>
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
            <div className="card-actions">
              <button className="learned-button" onClick={handleMarkAsLearned}>
                ✓ Mark as Learned
              </button>
              <button className="next-button" onClick={handleNextQuestion}>
                Next Question →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flashcard" onClick={handleCardClick}>
          <div className="flashcard-content">
            {mode === MODES.GREEK_TO_ENGLISH ? (
              <>
                <div className="flashcard-main">{currentWord.greek}</div>
                {showTranslation && (
                  <>
                    <div className="flashcard-translation">
                      {currentWord.english}
                    </div>
                    <button 
                      className="learned-button-card"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsLearned()
                      }}
                    >
                      ✓ Mark as Learned
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flashcard-main">{currentWord.english}</div>
                {showTranslation && (
                  <>
                    <div className="flashcard-translation">
                      {currentWord.greek}
                    </div>
                    <button 
                      className="learned-button-card"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsLearned()
                      }}
                    >
                      ✓ Mark as Learned
                    </button>
                  </>
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
