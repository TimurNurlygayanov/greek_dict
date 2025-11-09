import { useState, useEffect, useRef } from 'react'
import dictionaryData from '../dictionary.json'
import { incrementTodayExercises } from '../utils/storage'
import { getUserLists, markWordAsLearned } from '../utils/wordLists'
import AuthModal from '../components/AuthModal'
import AddToListModal from '../components/AddToListModal'
import DailyPracticeWidget from '../components/DailyPracticeWidget'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import useAuthGuard from '../hooks/useAuthGuard'
import useWordLists from '../hooks/useWordLists'

const MODES = {
  GREEK_TO_ENGLISH: 'greek-to-english',
  ENGLISH_TO_GREEK: 'english-to-greek',
  MULTIPLE_CHOICE: 'multiple-choice'
}

const Flashcards = () => {
  const { showAuthModal, closeAuthModal } = useAuthGuard(true)
  const { lists, refreshLists } = useWordLists(!showAuthModal)

  const [selectedList, setSelectedList] = useState(null)
  const [mode, setMode] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [countdown, setCountdown] = useState(null)

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Detect if device has touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Swipe threshold (minimum distance for a swipe)
  const minSwipeDistance = 50

  // Calculate font size based on text length to prevent overflow and multi-line wrapping
  const getFontSize = (text) => {
    const length = text.length
    if (length > 30) return 'clamp(2rem, 5vw, 3.5rem)'
    if (length > 20) return 'clamp(2.5rem, 6vw, 4.5rem)'
    if (length > 15) return 'clamp(3rem, 7vw, 5.5rem)'
    return 'clamp(3.5rem, 8vw, 6.5rem)'
  }

  // Reload lists when returning to list selection
  useEffect(() => {
    if (!selectedList && !showAuthModal) {
      refreshLists()
    }
  }, [selectedList, showAuthModal, refreshLists])

  // Auto-advance countdown for multiple choice
  useEffect(() => {
    if (mode === MODES.MULTIPLE_CHOICE && selectedAnswer !== null) {
      setCountdown(5)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            handleNextQuestion()
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setCountdown(null)
    }
  }, [selectedAnswer, mode])

  // Get available words (excluding learned ones)
  const getAvailableWords = () => {
    if (!selectedList) return []
    return selectedList.words.filter(word => {
      const isNotLearned = !selectedList.learnedWords.includes(word.greek)
      return isNotLearned
    })
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
    setCountdown(null)
    const wrongAnswers = getRandomWords(2, word)
    const options = [word.english, ...wrongAnswers].sort(() => 0.5 - Math.random())
    setMultipleChoiceOptions(options)
  }

  const handleMarkAsLearned = async () => {
    if (!selectedList || !currentWord) return

    try {
      await markWordAsLearned(selectedList.id, currentWord.greek)
      // Reload lists to get updated data
      await refreshLists()
      // Update selected list from reloaded lists
      const updatedLists = await getUserLists(false)
      const updatedList = updatedLists.find(l => l.id === selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }
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

  // Touch event handlers for swipe gestures
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX)

    // Swipe right: Go to next card (only in flashcard mode with translation shown)
    if (isHorizontalSwipe && distanceX < -minSwipeDistance && showTranslation && mode !== MODES.MULTIPLE_CHOICE) {
      handleCardClick()
    }

    // Swipe left: Also go to next card (alternative gesture)
    if (isHorizontalSwipe && distanceX > minSwipeDistance && showTranslation && mode !== MODES.MULTIPLE_CHOICE) {
      handleCardClick()
    }

    // Swipe up: Mark as learned
    if (isVerticalSwipe && distanceY > minSwipeDistance && showTranslation) {
      handleMarkAsLearned()
    }
  }

  // Show list selection
  if (!selectedList) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
        {showAuthModal && <AuthModal onClose={closeAuthModal} />}

        {/* Daily Practice Widget */}
        {!showAuthModal && (
          <DailyPracticeWidget onSelectDailyPractice={handleListSelect} />
        )}

        {lists.length === 0 ? (
          <Card variant="elevated" padding="lg" className="text-center">
            <h2 className="text-2xl font-semibold mb-4" style={{ margin: 0 }}>No word lists yet</h2>
            <p className="text-secondary mb-2">You don't have any word lists yet.</p>
            <p className="text-secondary">Go to Dictionary and add words to lists to start practicing!</p>
          </Card>
        ) : (
          <div className="card-grid">
            {lists.map((list) => {
              const availableCount = list.words.filter(
                w => !list.learnedWords.includes(w.greek)
              ).length
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'

              return (
                <Card
                  key={list.id}
                  variant="elevated"
                  padding="lg"
                  hoverable
                  onClick={() => handleListSelect(list)}
                  className="animate-fade-in-up"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-semibold flex-1" style={{ margin: 0 }}>
                      {list.name}
                    </h3>
                    {isDefault && <Badge variant="info" size="sm">Default</Badge>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-lg font-medium" style={{ color: 'var(--color-primary-600)' }}>
                      {availableCount} words to learn
                    </div>
                    <div className="text-sm text-secondary">
                      {list.words.length} total words
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Show mode selection
  if (!mode) {
    const availableWords = getAvailableWords()
    if (availableWords.length === 0) {
      return (
        <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
          <div className="mb-6">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setSelectedList(null)}
              icon={<span>←</span>}
            >
              Back to lists
            </Button>
          </div>

          <Card variant="elevated" padding="lg" className="text-center">
            <h2 className="text-4xl font-bold mb-4" style={{ margin: 0 }}>
              All words learned! 🎉
            </h2>
            <p className="text-lg text-secondary mb-6">
              Great job! You've mastered all words in "{selectedList.name}"
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setSelectedList(null)}
            >
              Choose Another List
            </Button>
          </Card>
        </div>
      )
    }

    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setSelectedList(null)}
            icon={<span>←</span>}
          >
            Back to lists
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{ color: 'white', margin: 0 }}>
            Choose Game Mode
          </h1>
          <p className="text-lg mb-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Playing with: {selectedList.name} ({availableWords.length} words)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card
            variant="elevated"
            padding="lg"
            hoverable
            onClick={() => startMode(MODES.GREEK_TO_ENGLISH)}
            className="animate-fade-in-up text-center"
          >
            <h3 className="text-2xl font-bold mb-3" style={{ margin: 0 }}>
              Greek → English
            </h3>
            <p className="text-secondary">
              See the Greek word and guess the translation
            </p>
          </Card>

          <Card
            variant="elevated"
            padding="lg"
            hoverable
            onClick={() => startMode(MODES.ENGLISH_TO_GREEK)}
            className="animate-fade-in-up text-center"
          >
            <h3 className="text-2xl font-bold mb-3" style={{ margin: 0 }}>
              English → Greek
            </h3>
            <p className="text-secondary">
              See the translation and remember the Greek word
            </p>
          </Card>

          <Card
            variant="elevated"
            padding="lg"
            hoverable
            onClick={() => startMode(MODES.MULTIPLE_CHOICE)}
            className="animate-fade-in-up text-center"
          >
            <h3 className="text-2xl font-bold mb-3" style={{ margin: 0 }}>
              Multiple Choice
            </h3>
            <p className="text-secondary">
              Choose the correct translation from three options
            </p>
          </Card>
        </div>
      </div>
    )
  }

  // Show game
  if (!currentWord) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setMode(null)}
            icon={<span>←</span>}
          >
            Back to modes
          </Button>
        </div>

        <Card variant="elevated" padding="lg" className="text-center">
          <h2 className="text-4xl font-bold" style={{ margin: 0 }}>No words available!</h2>
        </Card>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
      <div className="flex-between mb-6">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setMode(null)}
          icon={<span>←</span>}
        >
          Back to modes
        </Button>
        <div className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {selectedList.name} • {getAvailableWords().length} words left
        </div>
      </div>

      {mode === MODES.MULTIPLE_CHOICE ? (
        <Card variant="elevated" padding="xl" className="animate-scale-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="text-center mb-8">
            <h2 className="font-bold mb-6" style={{ margin: 0, color: 'var(--color-primary-600)', fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: '1.2' }}>
              {currentWord.greek}
            </h2>
          </div>

          <div className="flex flex-col gap-3" style={{ maxWidth: '600px', margin: '0 auto', marginBottom: 'var(--space-12)' }}>
            {multipleChoiceOptions.map((option, index) => {
              let variant = 'outline'
              if (selectedAnswer === option) {
                variant = isCorrect ? 'success' : 'danger'
              } else if (selectedAnswer !== null && option === currentWord.english) {
                variant = 'success'
              }

              return (
                <Button
                  key={index}
                  variant={variant}
                  size="lg"
                  onClick={() => handleAnswerClick(option)}
                  disabled={selectedAnswer !== null}
                  fullWidth
                  style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                    padding: 'var(--space-4) var(--space-5)',
                    justifyContent: 'center',
                    minHeight: '60px'
                  }}
                >
                  {option}
                </Button>
              )
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="flex gap-4 mt-8 justify-center flex-wrap animate-fade-in" style={{ marginBottom: 'var(--space-10)' }}>
              {isCorrect && (
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleMarkAsLearned}
                  icon={<span>✓</span>}
                >
                  Mark as Learned
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAddToListModal(true)}
                icon={<span>+</span>}
              >
                Add to List
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextQuestion}
              >
                {countdown !== null ? `Next Question (${countdown}s)` : 'Next Question'}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card
          variant="elevated"
          padding="xl"
          onClick={handleCardClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="animate-scale-in"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            cursor: 'pointer',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            touchAction: 'pan-y' // Allow vertical scroll but detect horizontal swipes
          }}
        >
          {mode === MODES.GREEK_TO_ENGLISH ? (
            <>
              <h2 className="font-bold mb-6" style={{ margin: 0, color: 'var(--color-primary-600)', fontSize: getFontSize(currentWord.greek), lineHeight: '1.2' }}>
                {currentWord.greek}
              </h2>
              {showTranslation && (
                <div className="animate-fade-in">
                  <div className="font-bold mb-6 text-secondary" style={{ fontSize: getFontSize(currentWord.english), lineHeight: '1.2' }}>
                    {currentWord.english}
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsLearned()
                      }}
                      icon={<span>✓</span>}
                    >
                      Mark as Learned
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddToListModal(true)
                      }}
                      icon={<span>+</span>}
                    >
                      Add to List
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-bold mb-6" style={{ margin: 0, color: 'var(--color-primary-600)', fontSize: getFontSize(currentWord.english), lineHeight: '1.2' }}>
                {currentWord.english}
              </h2>
              {showTranslation && (
                <div className="animate-fade-in">
                  <div className="font-bold mb-6 text-secondary" style={{ fontSize: getFontSize(currentWord.greek), lineHeight: '1.2' }}>
                    {currentWord.greek}
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsLearned()
                      }}
                      icon={<span>✓</span>}
                    >
                      Mark as Learned
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddToListModal(true)
                      }}
                      icon={<span>+</span>}
                    >
                      Add to List
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          <div
            className="text-tertiary mt-8"
            style={{
              fontSize: showTranslation ? 'clamp(0.875rem, 2vw, 1.125rem)' : 'clamp(1rem, 2.5vw, 1.5rem)',
              minHeight: '2rem',
              transition: 'opacity 0.3s ease',
              opacity: 1
            }}
          >
            {!showTranslation && (isTouchDevice ? 'Tap to reveal translation' : 'Click to reveal translation')}
            {showTranslation && (isTouchDevice
              ? 'Swipe horizontally for next • Swipe up to mark as learned'
              : 'Click anywhere to continue')}
          </div>
        </Card>
      )}

      {showAddToListModal && currentWord && (
        <AddToListModal
          word={currentWord}
          onClose={() => setShowAddToListModal(false)}
          onSuccess={() => {
            setShowAddToListModal(false)
          }}
        />
      )}
    </div>
  )
}

export default Flashcards
