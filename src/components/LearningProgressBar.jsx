import './LearningProgressBar.css'

const LearningProgressBar = ({ learningPoints = 0 }) => {
  // Ensure learningPoints is between 0 and 4
  const points = Math.min(Math.max(learningPoints, 0), 4)

  // Define colors for each level
  const levelColors = [
    'var(--color-primary-200)', // Level 1 - Light blue
    'var(--color-primary-400)', // Level 2 - Medium blue
    'var(--color-primary-600)', // Level 3 - Strong blue
    'var(--color-success-500)'  // Level 4 - Green (completely learned)
  ]

  return (
    <div className="learning-progress-bar">
      {[0, 1, 2, 3].map((index) => {
        const isActive = index < points
        const color = isActive ? levelColors[index] : 'rgba(255, 255, 255, 0.2)'

        return (
          <div
            key={index}
            className={`progress-cube ${isActive ? 'active' : ''}`}
            style={{
              backgroundColor: color
            }}
          />
        )
      })}
    </div>
  )
}

export default LearningProgressBar
