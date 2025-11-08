import { Link } from 'react-router-dom'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import './Landing.css'

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="landing-title">Ellinaki</h1>
          <p className="landing-subtitle">Master Greek vocabulary for A1, A2, B1, and B2 exams</p>
          <p className="landing-description">
            Interactive learning tools with 6,660+ words tagged by level. Practice at your own pace, from beginner to advanced.
          </p>

          <div className="cta-buttons">
            <Link to="/dictionary">
              <Button variant="primary" size="xl">
                Get Started
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="xl">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-grid">
          <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up">
            <div className="feature-icon">📚</div>
            <h3 className="feature-title">Level-Based Dictionary</h3>
            <p className="feature-description">
              6,660+ Greek words tagged by level (A1-B2). Filter by your target exam level.
            </p>
          </Card>

          <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">🎮</div>
            <h3 className="feature-title">Interactive Flashcards</h3>
            <p className="feature-description">
              Practice with multiple game modes: flashcards, multiple choice, and more.
            </p>
          </Card>

          <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Track Progress</h3>
            <p className="feature-description">
              Monitor your learning journey with detailed statistics and progress tracking.
            </p>
          </Card>

          <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Custom Lists</h3>
            <p className="feature-description">
              Create personalized word lists to focus on the vocabulary you need most.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Landing

