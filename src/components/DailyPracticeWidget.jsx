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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }

  const getCardTransform = () => {
    if (!isHovering) return 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    const rotateX = (mousePosition.y - 0.5) * -10
    const rotateY = (mousePosition.x - 0.5) * 10
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  const getGlowPosition = () => {
    return {
      left: `${mousePosition.x * 100}%`,
      top: `${mousePosition.y * 100}%`
    }
  }

  if (loading || isHidden) {
    return null
  }

  if (!dailyData || dailyData.needsSetup) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <Card
          variant="elevated"
          padding="lg"
          className="mb-6 animate-fade-in-up"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transform: getCardTransform(),
            transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
            boxShadow: isHovering
              ? '0 20px 60px rgba(102, 126, 234, 0.4), 0 0 40px rgba(118, 75, 162, 0.3)'
              : '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Lighting effect */}
          {isHovering && (
            <div
              style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                ...getGlowPosition(),
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                transition: 'left 0.1s ease, top 0.1s ease'
              }}
            />
          )}

          <button
            onClick={() => setIsHidden(true)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              zIndex: 2
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ×
          </button>
          <div className="text-center" onClick={() => setShowLevelModal(true)} style={{ cursor: 'pointer', position: 'relative', zIndex: 1 }}>
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-2xl font-bold mb-3" style={{ margin: 0, color: 'white' }}>
              Daily Practice
            </h3>
            <p className="text-sm mb-5" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Start your learning journey with 10 words a day!
            </p>
            <Button variant="secondary" size="lg">
              Get Started
            </Button>
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
        padding="lg"
        className="mb-6 animate-fade-in-up"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          transform: getCardTransform(),
          transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
          boxShadow: isHovering
            ? '0 20px 60px rgba(102, 126, 234, 0.4), 0 0 40px rgba(118, 75, 162, 0.3)'
            : '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Lighting effect */}
        {isHovering && (
          <div
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
              ...getGlowPosition(),
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              transition: 'left 0.1s ease, top 0.1s ease',
              zIndex: 0
            }}
          />
        )}

        {/* Sparkle animation background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            animation: 'pulse 3s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <button
          onClick={() => setIsHidden(true)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            zIndex: 2
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ×
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="text-2xl font-bold" style={{ margin: 0, color: 'white' }}>
                  Today's Practice
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" size="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', color: 'white' }}>
                    {dailyData.level}
                  </Badge>
                  <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
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
              style={{ color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' }}
            >
              Change Level
            </Button>
          </div>

          <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {wordsCount} {wordsCount === 10 ? 'new words' : 'words'} to practice today
          </p>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleStartPractice}
            disabled={wordsCount === 0}
            fullWidth
          >
            {wordsCount > 0 ? 'Start Practice →' : 'All words learned! 🎉'}
          </Button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
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
