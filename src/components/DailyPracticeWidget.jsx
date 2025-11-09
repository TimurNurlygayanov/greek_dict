import { useState, useEffect } from 'react'
import { getDailyPractice, setupDailyPractice, updateDailyPracticeLevel } from '../utils/dailyPractice'
import Card from './common/Card'
import Button from './common/Button'
import Badge from './common/Badge'
import Modal from './common/Modal'

const DailyPracticeWidget = ({ onSelectDailyPractice }) => {
  const [dailyData, setDailyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [isHidden, setIsHidden] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    loadDailyPractice()
  }, [])

  const loadDailyPractice = async () => {
    setLoading(true)
    try {
      const data = await getDailyPractice()
      setDailyData(data)
      // Don't auto-show modal, only show when user clicks widget
    } catch (error) {
      console.error('Error loading daily practice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupLevel = async (level) => {
    setSelectedLevel(level)
    try {
      const data = await setupDailyPractice(level)
      setDailyData(data)
      setShowLevelModal(false)

      // Automatically navigate to flashcard game after setup
      if (data && data.words && data.words.length > 0) {
        const dailyList = {
          id: 'daily-practice',
          name: `Today's ${data.level} Practice`,
          words: data.words,
          learnedWords: []
        }
        onSelectDailyPractice(dailyList)
      }
    } catch (error) {
      alert(error.message || 'Failed to setup daily practice')
    }
  }

  const handleChangeLevel = async (level) => {
    setSelectedLevel(level)
    try {
      const data = await updateDailyPracticeLevel(level)
      setDailyData(data)
      setShowLevelModal(false)
    } catch (error) {
      alert(error.message || 'Failed to update level')
    }
  }

  const handleStartPractice = () => {
    if (dailyData && dailyData.words && dailyData.words.length > 0) {
      const dailyList = {
        id: 'daily-practice',
        name: `Today's ${dailyData.level} Practice`,
        words: dailyData.words,
        learnedWords: []
      }
      onSelectDailyPractice(dailyList)
    }
  }

  const getCardTransform = () => {
    if (!isHovering) return 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
    return `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.03)`
  }

  if (loading || isHidden) {
    return null
  }

  if (!dailyData || dailyData.needsSetup) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <Card
          variant="elevated"
          padding="xl"
          className="mb-6 animate-fade-in-up"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => setShowLevelModal(true)}
          style={{
            background: 'linear-gradient(135deg, #0066cc 0%, #004999 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: getCardTransform(),
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: isHovering
              ? '0 8px 30px rgba(0, 102, 204, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '3px solid white'
          }}
        >
          {/* Greek key pattern border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: 'repeating-linear-gradient(90deg, white 0px, white 12px, transparent 12px, transparent 16px, white 16px, white 20px, transparent 20px, transparent 24px)',
              opacity: 0.3
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: 'repeating-linear-gradient(90deg, white 0px, white 12px, transparent 12px, transparent 16px, white 16px, white 20px, transparent 20px, transparent 24px)',
              opacity: 0.3
            }}
          />

          {/* Mediterranean wave pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsHidden(true)
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.25)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 2,
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ×
          </button>
          <div className="text-center" style={{ position: 'relative', zIndex: 1, padding: '20px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>🏛️</div>
            <h3 className="text-3xl font-bold mb-4" style={{ margin: 0, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              Daily Practice
            </h3>
            <p className="text-lg mb-6" style={{ color: 'rgba(255, 255, 255, 0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
              Start your learning journey with 10 words a day
            </p>
            <div
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#0066cc',
                padding: '14px 40px',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s',
                transform: isHovering ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              Get Started →
            </div>
          </div>
        </Card>

        {showLevelModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowLevelModal(false)}
            title="Choose Your Level"
            size="md"
          >
            <div className="mb-4">
              <p className="text-secondary">
                Select your current Greek language level to get personalized daily practice words.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['A1', 'A2', 'B1', 'B2'].map((level) => (
                <Card
                  key={level}
                  variant="elevated"
                  padding="md"
                  hoverable
                  onClick={() => handleSetupLevel(level)}
                  className="text-center cursor-pointer"
                >
                  <div className="text-3xl font-bold text-primary mb-2">{level}</div>
                  <div className="text-xs text-secondary">
                    {level === 'A1' && 'Beginner'}
                    {level === 'A2' && 'Elementary'}
                    {level === 'B1' && 'Intermediate'}
                    {level === 'B2' && 'Upper Intermediate'}
                  </div>
                </Card>
              ))}
            </div>
          </Modal>
        )}
      </div>
    )
  }

  const wordsCount = dailyData.words?.length || 0

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
      <Card
        variant="elevated"
        padding="xl"
        className="mb-6 animate-fade-in-up"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={wordsCount > 0 ? handleStartPractice : undefined}
        style={{
          background: 'linear-gradient(135deg, #0066cc 0%, #004999 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          cursor: wordsCount > 0 ? 'pointer' : 'default',
          transform: getCardTransform(),
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          boxShadow: isHovering
            ? '0 8px 30px rgba(0, 102, 204, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '3px solid white'
        }}
      >
        {/* Greek key pattern border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'repeating-linear-gradient(90deg, white 0px, white 12px, transparent 12px, transparent 16px, white 16px, white 20px, transparent 20px, transparent 24px)',
            opacity: 0.3
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'repeating-linear-gradient(90deg, white 0px, white 12px, transparent 12px, transparent 16px, white 16px, white 20px, transparent 20px, transparent 24px)',
            opacity: 0.3
          }}
        />

        {/* Mediterranean wave pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsHidden(true)
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 2,
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ×
        </button>

        <div style={{ position: 'relative', zIndex: 1, padding: '10px 0' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>🏛️</div>
              <div>
                <h3 className="text-2xl font-bold" style={{ margin: 0, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  Today's Practice
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" size="sm" style={{ backgroundColor: 'white', color: '#0066cc', fontWeight: 'bold' }}>
                    {dailyData.level}
                  </Badge>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                    {dailyData.topic}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowLevelModal(true)
              }}
              style={{
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                background: 'rgba(255, 255, 255, 0.1)',
                fontWeight: '600'
              }}
            >
              Change Level
            </Button>
          </div>

          <p className="text-base mb-5" style={{ color: 'rgba(255, 255, 255, 0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.2)', fontWeight: '500' }}>
            {wordsCount} {wordsCount === 10 ? 'new words' : 'words'} to practice today
          </p>

          <div
            style={{
              display: wordsCount > 0 ? 'inline-block' : 'block',
              background: 'white',
              color: '#0066cc',
              padding: '14px 40px',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
              transform: isHovering && wordsCount > 0 ? 'scale(1.05)' : 'scale(1)',
              textAlign: 'center',
              width: wordsCount > 0 ? 'auto' : '100%',
              cursor: wordsCount > 0 ? 'pointer' : 'default',
              opacity: wordsCount > 0 ? 1 : 0.7
            }}
          >
            {wordsCount > 0 ? 'Start Practice →' : 'All words learned! 🎉'}
          </div>
        </div>

      </Card>

      {showLevelModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowLevelModal(false)}
          title="Change Your Level"
          size="md"
        >
          <div className="mb-4">
            <p className="text-secondary">
              Current level: <strong>{dailyData.level}</strong>. Select a new level to get different practice words.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['A1', 'A2', 'B1', 'B2'].map((level) => (
              <Card
                key={level}
                variant="elevated"
                padding="md"
                hoverable
                onClick={() => handleChangeLevel(level)}
                className="text-center cursor-pointer"
                style={{
                  borderColor: dailyData.level === level ? 'var(--color-primary-500)' : undefined,
                  borderWidth: dailyData.level === level ? '2px' : undefined
                }}
              >
                <div className="text-3xl font-bold text-primary mb-2">{level}</div>
                <div className="text-xs text-secondary">
                  {level === 'A1' && 'Beginner'}
                  {level === 'A2' && 'Elementary'}
                  {level === 'B1' && 'Intermediate'}
                  {level === 'B2' && 'Upper Intermediate'}
                </div>
                {dailyData.level === level && (
                  <Badge variant="primary" size="sm" className="mt-2">Current</Badge>
                )}
              </Card>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default DailyPracticeWidget
