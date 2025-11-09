import { useState, useEffect, useRef } from 'react'
import dictionaryData from '../dictionary.json'
import { incrementTodayExercises } from '../utils/storage'
import { getUserLists, markWordAsLearned } from '../utils/wordLists'
import { categorizeAndSortLists } from '../utils/listCategorization'
import AuthModal from '../components/AuthModal'
import AddToListModal from '../components/AddToListModal'
import DailyPracticeWidget from '../components/DailyPracticeWidget'
import LearningProgressBar from '../components/LearningProgressBar'
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
  const [showModeTooltip, setShowModeTooltip] = useState(false)

  // Word order tracking for consistent practice
  const [wordOrder, setWordOrder] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

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

  // Get learning points for a word
  const getLearningPoints = (wordGreek) => {
    if (!selectedList || !wordGreek) return 0
    return selectedList.wordLearningPoints?.[wordGreek] || 0
  }

  // Load word order from localStorage or create new shuffled order
  const loadOrCreateWordOrder = () => {
    if (!selectedList) return []

    const availableWords = getAvailableWords()
    if (availableWords.length === 0) return []

    const storageKey = `wordOrder_${selectedList.id}`
    const stored = localStorage.getItem(storageKey)

    // Try to load stored order
    if (stored) {
      try {
        const storedOrder = JSON.parse(stored)
        // Validate that stored order still matches available words
        const storedGreekWords = storedOrder.map(w => w.greek)
        const availableGreekWords = availableWords.map(w => w.greek)

        // Check if the word lists match (same words available)
        const sameWords = storedGreekWords.length === availableGreekWords.length &&
          storedGreekWords.every(greek => availableGreekWords.includes(greek))

        if (sameWords) {
          return storedOrder
        }
      } catch (e) {
        console.error('Error loading word order:', e)
      }
    }

    // Create new shuffled order
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5)
    localStorage.setItem(storageKey, JSON.stringify(shuffled))
    return shuffled
  }

  // Shuffle word order manually
  const shuffleWordOrder = () => {
    if (!selectedList) return

    const availableWords = getAvailableWords()
    if (availableWords.length === 0) return

    const shuffled = [...availableWords].sort(() => Math.random() - 0.5)
    const storageKey = `wordOrder_${selectedList.id}`
    localStorage.setItem(storageKey, JSON.stringify(shuffled))

    setWordOrder(shuffled)
    setCurrentWordIndex(0)
    setCurrentWord(shuffled[0])
    setShowTranslation(false)
    setSelectedAnswer(null)
    setIsCorrect(null)

    if (mode === MODES.MULTIPLE_CHOICE) {
      const wrongAnswers = getRandomWords(2, shuffled[0])
      const options = [shuffled[0].english, ...wrongAnswers].sort(() => 0.5 - Math.random())
      setMultipleChoiceOptions(options)
    }
  }

  // Get next word from the order
  const getNextWordFromOrder = () => {
    if (wordOrder.length === 0) return null

    const nextIndex = (currentWordIndex + 1) % wordOrder.length
    setCurrentWordIndex(nextIndex)
    return wordOrder[nextIndex]
  }

  // Reload lists when returning to list selection
  useEffect(() => {
    if (!selectedList && !showAuthModal) {
      refreshLists()
    }
  }, [selectedList, showAuthModal, refreshLists])

  // Show tooltip on first game start
  useEffect(() => {
    if (mode && !localStorage.getItem('flashcards_modeSwitcherSeen')) {
      setShowModeTooltip(true)
    }
  }, [mode])

  // Auto-start mode when list is selected
  useEffect(() => {
    if (selectedList && mode) {
      startMode(mode)
    }
  }, [selectedList])

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

    // Auto-start game with last-used mode or default
    const lastMode = localStorage.getItem('flashcards_lastMode') || MODES.GREEK_TO_ENGLISH
    setMode(lastMode)

    setCurrentWord(null)
  }

  const startMode = (selectedMode) => {
    setMode(selectedMode)
    setShowTranslation(false)
    setSelectedAnswer(null)
    setIsCorrect(null)

    // Load or create word order
    const order = loadOrCreateWordOrder()
    if (order.length === 0) {
      alert('No words available in this list!')
      return
    }

    setWordOrder(order)
    setCurrentWordIndex(0)
    const word = order[0]
    setCurrentWord(word)

    if (selectedMode === MODES.MULTIPLE_CHOICE) {
      const wrongAnswers = getRandomWords(2, word)
      const options = [word.english, ...wrongAnswers].sort(() => 0.5 - Math.random())
      setMultipleChoiceOptions(options)
    }
  }

  const handleCardClick = async () => {
    // For multiple choice mode, only advance after answer is selected
    if (mode === MODES.MULTIPLE_CHOICE) {
      if (selectedAnswer === null) return
      // Move to next question
      handleNextQuestion()
      return
    }

    if (!showTranslation) {
      setShowTranslation(true)
      await incrementTodayExercises()
    } else {
      // Move to next word
      const word = getNextWordFromOrder()
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
    const word = getNextWordFromOrder()
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
      // Reload lists to get updated data
      await refreshLists()
      // Update selected list from reloaded lists
      const updatedLists = await getUserLists(false)
      const updatedList = updatedLists.find(l => l.id === selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }
      // Move to next word
      const word = getNextWordFromOrder()
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
    // Categorize and sort lists by learned percentage
    const { customLists, topicLists, levelLists } = categorizeAndSortLists(lists)

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
          <>
            {/* Custom Lists Section */}
            {customLists.length > 0 && (
              <div className="card-grid">
                {customLists.map((list) => {
                  const availableCount = list.words.filter(
                    w => !list.learnedWords.includes(w.greek)
                  ).length

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

            {/* Separator before Topic Lists */}
            {topicLists.length > 0 && (
              <div style={{
                borderTop: '2px solid rgba(255, 255, 255, 0.2)',
                margin: 'var(--space-8) 0'
              }} />
            )}

            {/* Topic Lists Section */}
            {topicLists.length > 0 && (
              <div className="card-grid">
                {topicLists.map((list) => {
                  const availableCount = list.words.filter(
                    w => !list.learnedWords.includes(w.greek)
                  ).length

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
                        <Badge variant="secondary" size="sm">Topic</Badge>
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

            {/* Separator before Level Lists */}
            {levelLists.length > 0 && (
              <div style={{
                borderTop: '2px solid rgba(255, 255, 255, 0.2)',
                margin: 'var(--space-8) 0'
              }} />
            )}

            {/* Level Lists Section */}
            {levelLists.length > 0 && (
              <div className="card-grid">
                {levelLists.map((list) => {
                  const availableCount = list.words.filter(
                    w => !list.learnedWords.includes(w.greek)
                  ).length

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
                        <Badge variant="info" size="sm">Level</Badge>
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
          </>
        )}
      </div>
    )
  }

  // Show game - if no words available
  if (!currentWord && selectedList) {
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
              All words learned!
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

        <Card variant="elevated" padding="lg" className="text-center">
          <h2 className="text-4xl font-bold" style={{ margin: 0 }}>No words available!</h2>
        </Card>
      </div>
    )
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    localStorage.setItem('flashcards_lastMode', newMode)
    localStorage.setItem('flashcards_modeSwitcherSeen', 'true')
    setShowModeTooltip(false)

    // Restart game with new mode
    startMode(newMode)
  }

  const handleModeSwitcherClick = () => {
    localStorage.setItem('flashcards_modeSwitcherSeen', 'true')
    setShowModeTooltip(false)
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
      <div className="flex-between mb-6">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setSelectedList(null)}
          icon={<span>←</span>}
        >
          Back to lists
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {selectedList.name} • {getAvailableWords().length} words left
          </div>

          {/* Mode Switcher */}
          <div style={{ position: 'relative' }}>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              onClick={handleModeSwitcherClick}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <option value={MODES.GREEK_TO_ENGLISH} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                Greek → English
              </option>
              <option value={MODES.ENGLISH_TO_GREEK} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                English → Greek
              </option>
              <option value={MODES.MULTIPLE_CHOICE} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                Multiple Choice
              </option>
            </select>

            {/* Tooltip */}
            {showModeTooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'white',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                Try different game modes!
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '20px',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid var(--color-primary-600)'
                  }}
                />
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={shuffleWordOrder}
            icon={<span>🔀</span>}
            title="Shuffle word order"
          >
            Shuffle
          </Button>
        </div>
      </div>

      {mode === MODES.MULTIPLE_CHOICE ? (
        <Card
          variant="elevated"
          padding="xl"
          className="animate-scale-in"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            cursor: selectedAnswer !== null ? 'pointer' : 'default'
          }}
          onClick={handleCardClick}
        >
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
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAnswerClick(option)
                  }}
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
            <div style={{ position: 'relative' }}>
              <div className="flex gap-4 mt-8 justify-center items-center flex-wrap animate-fade-in">
                <LearningProgressBar learningPoints={getLearningPoints(currentWord.greek)} />
                {isCorrect && (
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
                )}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-60px',
                right: '0',
                zIndex: 10
              }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAddToListModal(true)
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}
                  title="Add to Words List"
                >
                  +
                </Button>
              </div>
            </div>
          )}

          <div
            className="text-tertiary mt-8"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
              minHeight: '2rem',
              transition: 'opacity 0.3s ease',
              opacity: 1,
              textAlign: 'center'
            }}
          >
            {selectedAnswer === null && 'Choose the correct translation'}
            {selectedAnswer !== null && (isTouchDevice ? 'Tap anywhere to continue' : 'Click anywhere to continue')}
          </div>
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
                <div className="animate-fade-in" style={{ position: 'relative' }}>
                  <div className="font-bold mb-6 text-secondary" style={{ fontSize: getFontSize(currentWord.english), lineHeight: '1.2' }}>
                    {currentWord.english}
                  </div>
                  <div className="flex gap-4 justify-center items-center flex-wrap">
                    <LearningProgressBar learningPoints={getLearningPoints(currentWord.greek)} />
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
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-80px',
                    right: '-20px',
                    zIndex: 10
                  }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddToListModal(true)
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}
                      title="Add to Words List"
                    >
                      +
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
                <div className="animate-fade-in" style={{ position: 'relative' }}>
                  <div className="font-bold mb-6 text-secondary" style={{ fontSize: getFontSize(currentWord.greek), lineHeight: '1.2' }}>
                    {currentWord.greek}
                  </div>
                  <div className="flex gap-4 justify-center items-center flex-wrap">
                    <LearningProgressBar learningPoints={getLearningPoints(currentWord.greek)} />
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
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-80px',
                    right: '-20px',
                    zIndex: 10
                  }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddToListModal(true)
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}
                      title="Add to Words List"
                    >
                      +
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
