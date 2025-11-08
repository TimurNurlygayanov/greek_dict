import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import { incrementTodayExercises } from '../utils/storage'
import { getUserLists, markWordAsLearned } from '../utils/wordLists'
import AuthModal from '../components/AuthModal'
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
  const [levelFilter, setLevelFilter] = useState('ALL')

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Swipe threshold (minimum distance for a swipe)
  const minSwipeDistance = 50

  // Reload lists when returning to list selection
  useEffect(() => {
    if (!selectedList && !showAuthModal) {
      refreshLists()
    }
  }, [selectedList, showAuthModal, refreshLists])

  // Get available words (excluding learned ones and filtered by level)
  const getAvailableWords = () => {
    if (!selectedList) return []
    return selectedList.words.filter(word => {
      const isNotLearned = !selectedList.learnedWords.includes(word.greek)
      const matchesLevel = levelFilter === 'ALL' || word.level === levelFilter
      return isNotLearned && matchesLevel
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

        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{ color: 'white', margin: 0 }}>
            Choose Your Practice List
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Select which words you want to practice
          </p>
        </div>

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

          {/* Level Filter */}
          <Card variant="glass" padding="md" className="mb-4">
            <div className="text-sm font-medium text-secondary mb-3">Filter by level:</div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={levelFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter('ALL')}
              >
                All
              </Button>
              <Button
                variant={levelFilter === 'A1' ? 'success' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter('A1')}
              >
                A1
              </Button>
              <Button
                variant={levelFilter === 'A2' ? 'info' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter('A2')}
              >
                A2
              </Button>
              <Button
                variant={levelFilter === 'B1' ? 'warning' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter('B1')}
              >
                B1
              </Button>
              <Button
                variant={levelFilter === 'B2' ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter('B2')}
              >
                B2
              </Button>
            </div>
          </Card>
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
        <Card variant="elevated" padding="xl" className="animate-scale-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="text-center mb-8">
            <h2 className="text-6xl font-bold mb-4" style={{ margin: 0, color: 'var(--color-primary-600)' }}>
              {currentWord.greek}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
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
                  size="xl"
                  onClick={() => handleAnswerClick(option)}
                  disabled={selectedAnswer !== null}
                  fullWidth
                  style={{
                    fontSize: 'var(--text-xl)',
                    padding: 'var(--space-6)',
                    justifyContent: 'center'
                  }}
                >
                  {option}
                </Button>
              )
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="flex gap-4 mt-8 justify-center animate-fade-in">
              <Button
                variant="success"
                size="lg"
                onClick={handleMarkAsLearned}
                icon={<span>✓</span>}
              >
                Mark as Learned
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextQuestion}
              >
                Next Question →
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
            maxWidth: '800px',
            margin: '0 auto',
            cursor: 'pointer',
            minHeight: '400px',
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
              <h2 className="text-7xl font-bold mb-6" style={{ margin: 0, color: 'var(--color-primary-600)' }}>
                {currentWord.greek}
              </h2>
              {showTranslation && (
                <div className="animate-fade-in">
                  <div className="text-4xl font-semibold mb-6 text-secondary">
                    {currentWord.english}
                  </div>
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
              )}
            </>
          ) : (
            <>
              <h2 className="text-7xl font-bold mb-6" style={{ margin: 0, color: 'var(--color-primary-600)' }}>
                {currentWord.english}
              </h2>
              {showTranslation && (
                <div className="animate-fade-in">
                  <div className="text-4xl font-semibold mb-6 text-secondary">
                    {currentWord.greek}
                  </div>
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
              )}
            </>
          )}
          {!showTranslation && (
            <div className="text-lg text-tertiary mt-8 animate-fade-in">
              Tap to reveal translation
            </div>
          )}
          {showTranslation && (
            <div className="text-sm text-tertiary mt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Swipe horizontally for next • Swipe up to mark as learned
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default Flashcards
