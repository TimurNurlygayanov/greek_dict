import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import { getTodayExercises, getMemorizedWords } from '../utils/storage'
import AuthModal from '../components/AuthModal'
import Card from '../components/common/Card'
import Badge from '../components/common/Badge'
import useAuthGuard from '../hooks/useAuthGuard'
import useWordLists from '../hooks/useWordLists'

const Progress = () => {
  const { showAuthModal, closeAuthModal } = useAuthGuard(true)
  const { lists } = useWordLists(!showAuthModal)

  const [exercisesToday, setExercisesToday] = useState(0)
  const [memorizedCount, setMemorizedCount] = useState(0)
  const [memorizedWords, setMemorizedWords] = useState([])
  const totalWords = dictionaryData.length

  useEffect(() => {
    const updateProgress = async () => {
      const exercises = await getTodayExercises()
      const memorized = await getMemorizedWords()
      setExercisesToday(exercises)
      setMemorizedCount(memorized.length)
      setMemorizedWords(memorized)
    }

    updateProgress()

    // Listen for visibility change to update when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateProgress()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Calculate level-based statistics
  const levelStats = {
    A1: { total: 0, learned: 0 },
    A2: { total: 0, learned: 0 },
    B1: { total: 0, learned: 0 },
    B2: { total: 0, learned: 0 }
  }

  dictionaryData.forEach(word => {
    if (word.level && levelStats[word.level]) {
      levelStats[word.level].total++
      if (memorizedWords.includes(word.greek)) {
        levelStats[word.level].learned++
      }
    }
  })

  // Calculate achievements (including locked ones)
  const achievements = []
  const levels = ['A1', 'A2', 'B1', 'B2']

  levels.forEach(level => {
    const stats = levelStats[level]
    const percentage = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0

    // Always show Master achievement (locked if not achieved)
    achievements.push({
      id: `${level}-master`,
      level,
      title: `${level} Master`,
      description: percentage === 100 ? `Mastered all ${stats.total} ${level} words!` : `Master all ${stats.total} ${level} words`,
      icon: '🏆',
      color: getLevelColor(level),
      unlocked: percentage === 100,
      priority: 1
    })

    // Show Expert (75%) if achieved or close
    if (percentage >= 60) {
      achievements.push({
        id: `${level}-75`,
        level,
        title: `${level} Expert`,
        description: percentage >= 75 ? `Learned 75% of ${level} vocabulary` : `Learn 75% of ${level} vocabulary`,
        icon: '⭐',
        color: getLevelColor(level),
        unlocked: percentage >= 75,
        priority: 2
      })
    }

    // Show Intermediate (50%) if achieved or close
    if (percentage >= 35) {
      achievements.push({
        id: `${level}-50`,
        level,
        title: `${level} Intermediate`,
        description: percentage >= 50 ? `Learned 50% of ${level} vocabulary` : `Learn 50% of ${level} vocabulary`,
        icon: '🌟',
        color: getLevelColor(level),
        unlocked: percentage >= 50,
        priority: 3
      })
    }

    // Show Beginner (25%) if achieved or close
    if (percentage >= 10) {
      achievements.push({
        id: `${level}-25`,
        level,
        title: `${level} Beginner`,
        description: percentage >= 25 ? `Started ${level} - 25% complete` : `Learn 25% of ${level} vocabulary`,
        icon: '✨',
        color: getLevelColor(level),
        unlocked: percentage >= 25,
        priority: 4
      })
    }
  })

  // Special combined achievements
  const a1Complete = levelStats.A1.learned === levelStats.A1.total && levelStats.A1.total > 0
  const a2Complete = levelStats.A2.learned === levelStats.A2.total && levelStats.A2.total > 0
  const b1Complete = levelStats.B1.learned === levelStats.B1.total && levelStats.B1.total > 0
  const b2Complete = levelStats.B2.learned === levelStats.B2.total && levelStats.B2.total > 0

  // Elementary Complete (A1 + A2)
  if (a1Complete || a2Complete || (levelStats.A1.learned + levelStats.A2.learned) > 0) {
    achievements.push({
      id: 'elementary-complete',
      title: 'Elementary Complete',
      description: (a1Complete && a2Complete) ? 'Mastered both A1 and A2 levels!' : 'Master both A1 and A2 levels',
      icon: '🎓',
      color: 'var(--color-success-500)',
      unlocked: a1Complete && a2Complete,
      priority: 0
    })
  }

  // Intermediate Complete (B1 + B2)
  if (b1Complete || b2Complete || (levelStats.B1.learned + levelStats.B2.learned) > 0) {
    achievements.push({
      id: 'intermediate-complete',
      title: 'Intermediate Complete',
      description: (b1Complete && b2Complete) ? 'Mastered both B1 and B2 levels!' : 'Master both B1 and B2 levels',
      icon: '👑',
      color: 'var(--color-primary-500)',
      unlocked: b1Complete && b2Complete,
      priority: 0
    })
  }

  // Polyglot - Master all levels
  if (memorizedCount > 0) {
    const allComplete = a1Complete && a2Complete && b1Complete && b2Complete
    achievements.push({
      id: 'polyglot',
      title: 'Greek Polyglot',
      description: allComplete ? 'Mastered all 6,660 words!' : 'Master all Greek vocabulary levels',
      icon: '🌟',
      color: 'gold',
      unlocked: allComplete,
      priority: 0
    })
  }

  // Sort: unlocked first, then by priority
  achievements.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return a.priority - b.priority
  })

  function getLevelColor(level) {
    const colors = {
      'A1': 'var(--color-success-500)',
      'A2': 'var(--color-info-500)',
      'B1': 'var(--color-warning-500)',
      'B2': 'var(--color-danger-500)'
    }
    return colors[level] || 'var(--color-gray-500)'
  }

  const memorizedPercentage = totalWords > 0
    ? Math.round((memorizedCount / totalWords) * 100)
    : 0

  // Progress Bar Component
  const ProgressBar = ({ value, max, showLabel = true, size = 'md' }) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0
    const height = size === 'sm' ? '8px' : size === 'lg' ? '24px' : '16px'

    return (
      <div style={{ width: '100%' }}>
        <div
          style={{
            width: '100%',
            height: height,
            backgroundColor: 'var(--color-gray-200)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600))',
              transition: 'width 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'white'
            }}
          >
            {showLabel && percentage > 10 && `${percentage}%`}
          </div>
        </div>
        {showLabel && percentage <= 10 && (
          <div className="text-xs text-secondary mt-1">{percentage}%</div>
        )}
      </div>
    )
  }

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, progress }) => (
    <Card variant="elevated" padding="md">
      <div className="text-xs font-medium text-secondary mb-1">{title}</div>
      <div className="text-2xl font-bold mb-1 text-primary">{value}</div>
      {subtitle && <div className="text-xs text-secondary mb-2">{subtitle}</div>}
      {progress && <ProgressBar value={progress.value} max={progress.max} size="md" />}
    </Card>
  )

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-20)' }}>
      {showAuthModal && <AuthModal onClose={closeAuthModal} />}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          title="EXERCISES TODAY"
          value={exercisesToday}
          subtitle="Words practiced in all game modes"
        />
        <StatCard
          title="WORDS MASTERED"
          value={`${memorizedCount} / ${totalWords}`}
          subtitle="Correctly answered in multiple choice"
          progress={{ value: memorizedCount, max: totalWords }}
        />
      </div>

      {/* Level Distribution */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'white', margin: 0 }}>
          Progress by Level
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {levels.map((level) => {
            const stats = levelStats[level]
            const percentage = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0

            return (
              <Card key={level} variant="elevated" padding="lg" className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant={level === 'A1' ? 'success' : level === 'A2' ? 'info' : level === 'B1' ? 'warning' : 'danger'}
                    size="lg"
                  >
                    {level}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-lg font-semibold">{stats.learned} / {stats.total}</div>
                    <div className="text-xs text-secondary">words mastered</div>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: getLevelColor(level) }}>
                    {percentage}%
                  </div>
                </div>
                <ProgressBar value={stats.learned} max={stats.total} size="lg" />
              </Card>
            )
          })}
        </div>
      </div>

      {/* Achievements */}
      {achievements.filter(a => a.unlocked).length > 0 && (
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold" style={{ margin: 0 }}>Achievements</h2>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Unlocked {achievements.filter(a => a.unlocked).length} / {achievements.length}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              overflowX: 'auto',
              paddingBottom: 'var(--space-2)',
              scrollbarWidth: 'thin'
            }}
          >
            {achievements.filter(a => a.unlocked).map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  minWidth: '120px',
                  textAlign: 'center',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  background: `linear-gradient(135deg, ${achievement.color}10, ${achievement.color}05)`,
                  border: `2px solid ${achievement.color}30`
                }}
                title={achievement.description}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-1)' }}>
                  {achievement.icon}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: achievement.color,
                    lineHeight: '1.2'
                  }}
                >
                  {achievement.title}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Progress by Lists */}
      {lists.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'white', margin: 0 }}>
            Progress by Lists
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {lists.map((list) => {
              const totalInList = list.words.length
              const learnedInList = list.learnedWords.length
              const toLearn = totalInList - learnedInList
              const percentage = totalInList > 0
                ? Math.round((learnedInList / totalInList) * 100)
                : 0
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'

              return (
                <Card key={list.id} variant="elevated" padding="md" className="animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold flex-1" style={{ margin: 0 }}>
                      {list.name}
                    </h3>
                    {isDefault && <Badge variant="info" size="sm">Default</Badge>}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-secondary mb-1">Learned</div>
                      <div className="text-xl font-bold" style={{ color: 'var(--color-success-600)' }}>
                        {learnedInList}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-secondary mb-1">To Learn</div>
                      <div className="text-xl font-bold text-primary">{toLearn}</div>
                    </div>
                    <div>
                      <div className="text-xs text-secondary mb-1">Total</div>
                      <div className="text-xl font-bold text-secondary">{totalInList}</div>
                    </div>
                  </div>

                  {totalInList > 0 && (
                    <ProgressBar value={learnedInList} max={totalInList} />
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
