import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import {
  getTodayExercises,
  getMemorizedWords,
  getUserId
} from '../utils/storage'
import AuthModal from '../components/AuthModal'
import './Progress.css'

const Progress = ({ isActive = false }) => {
  const [exercisesToday, setExercisesToday] = useState(0)
  const [memorizedCount, setMemorizedCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const totalWords = dictionaryData.length

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

  useEffect(() => {
    const updateProgress = async () => {
      const exercises = await getTodayExercises()
      const memorized = await getMemorizedWords()
      setExercisesToday(exercises)
      setMemorizedCount(memorized.length)
    }

    updateProgress()
    // Update every second to show real-time progress
    const interval = setInterval(updateProgress, 1000)
    return () => clearInterval(interval)
  }, [])

  const memorizedPercentage = totalWords > 0 
    ? Math.round((memorizedCount / totalWords) * 100) 
    : 0

  return (
    <div className="progress">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      <h1 className="page-title">Your Progress</h1>
      
      <div className="progress-cards">
        <div className="progress-card">
          <div className="progress-card-icon">📊</div>
          <div className="progress-card-title">Exercises Today</div>
          <div className="progress-card-value">{exercisesToday}</div>
          <div className="progress-card-description">
            Words practiced in all game modes
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-card-icon">🎯</div>
          <div className="progress-card-title">Words Memorized</div>
          <div className="progress-card-value">
            {memorizedCount} / {totalWords}
          </div>
          <div className="progress-card-description">
            Correctly answered in multiple choice mode
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${memorizedPercentage}%` }}
            >
              {memorizedPercentage}%
            </div>
          </div>
        </div>
      </div>

      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Total words in dictionary:</span>
          <span className="stat-value">{totalWords}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Words to learn:</span>
          <span className="stat-value">{totalWords - memorizedCount}</span>
        </div>
      </div>
    </div>
  )
}

export default Progress

