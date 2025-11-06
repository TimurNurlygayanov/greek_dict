import { useState, useEffect } from 'react'
import dictionaryData from '../dictionary.json'
import {
  getTodayExercises,
  getMemorizedWords,
  getUserId
} from '../utils/storage'
import { getUserLists } from '../utils/wordLists'
import AuthModal from '../components/AuthModal'
import './Progress.css'

const Progress = () => {
  const [exercisesToday, setExercisesToday] = useState(0)
  const [memorizedCount, setMemorizedCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [lists, setLists] = useState([])
  const totalWords = dictionaryData.length

  useEffect(() => {
    // Show auth modal when component mounts if not authenticated
    const userId = getUserId()
    if (!userId || userId.startsWith('user_')) {
      setShowAuthModal(true)
    } else {
      loadLists()
    }
  }, [])

  const loadLists = async () => {
    const userLists = await getUserLists()
    // Always show all lists, including default ones
    setLists(userLists)
  }

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

  // Reload lists when auth modal is closed
  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    const userId = getUserId()
    if (userId && !userId.startsWith('user_')) {
      loadLists()
    }
  }

  const memorizedPercentage = totalWords > 0 
    ? Math.round((memorizedCount / totalWords) * 100) 
    : 0

  // Get default lists
  const unstudiedList = lists.find(l => l.id === 'unstudied')
  const learnedList = lists.find(l => l.id === 'learned')

  return (
    <div className="progress">
      {showAuthModal && <AuthModal onClose={handleAuthModalClose} />}
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

      {lists.length > 0 && (
        <div className="lists-progress">
          <h2 className="lists-progress-title">Progress by Lists</h2>
          <div className="lists-progress-grid">
            {lists.map((list) => {
              const totalInList = list.words.length
              const learnedInList = list.learnedWords.length
              const toLearn = totalInList - learnedInList
              const percentage = totalInList > 0 
                ? Math.round((learnedInList / totalInList) * 100) 
                : 0
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
              
              return (
                <div key={list.id} className="list-progress-card">
                  <div className="list-progress-header">
                    <h3 className="list-progress-name">
                      {list.name}
                      {isDefault && <span className="default-badge-small">Default</span>}
                    </h3>
                  </div>
                  <div className="list-progress-stats">
                    <div className="list-stat">
                      <span className="list-stat-label">Learned:</span>
                      <span className="list-stat-value">{learnedInList}</span>
                    </div>
                    <div className="list-stat">
                      <span className="list-stat-label">To learn:</span>
                      <span className="list-stat-value">{toLearn}</span>
                    </div>
                    <div className="list-stat">
                      <span className="list-stat-label">Total:</span>
                      <span className="list-stat-value">{totalInList}</span>
                    </div>
                  </div>
                  {totalInList > 0 && (
                    <div className="list-progress-bar-container">
                      <div 
                        className="list-progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage}%
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Total words in dictionary:</span>
          <span className="stat-value">{totalWords}</span>
        </div>
        {unstudiedList && (
          <div className="stat-item">
            <span className="stat-label">Unstudied words:</span>
            <span className="stat-value">{unstudiedList.words.length}</span>
          </div>
        )}
        {learnedList && (
          <div className="stat-item">
            <span className="stat-label">Learned words:</span>
            <span className="stat-value">{learnedList.words.length}</span>
          </div>
        )}
        <div className="stat-item">
          <span className="stat-label">Words to learn:</span>
          <span className="stat-value">{totalWords - memorizedCount}</span>
        </div>
      </div>
    </div>
  )
}

export default Progress

