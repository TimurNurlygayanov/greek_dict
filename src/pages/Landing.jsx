import { Link } from 'react-router-dom'
import Card from '../components/common/Card'
import './Landing.css'

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="landing-title">Ellinaki</h1>
          <p className="landing-subtitle">Master Greek vocabulary</p>
          <p className="landing-description">
            Interactive learning tools with 6,660+ words tagged by level. Practice at your own pace, from beginner to advanced.
          </p>
        </div>

        {/* Features Section */}
        <div className="features-grid">
          <Link to="/dictionary" style={{ textDecoration: 'none' }}>
            <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" hoverable>
              <div className="feature-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="12" y="8" width="40" height="48" rx="2" fill="#E3F2FD" stroke="#0D5EAF" strokeWidth="2"/>
                  <line x1="20" y1="20" x2="44" y2="20" stroke="#0D5EAF" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="28" x2="44" y2="28" stroke="#0D5EAF" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="36" x2="38" y2="36" stroke="#0D5EAF" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="44" x2="42" y2="44" stroke="#0D5EAF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Greek Dictionary</h3>
              <p className="feature-description">
                6,660+ Greek words tagged by level (A1-B2). Search and explore vocabulary.
              </p>
            </Card>
          </Link>

          <Link to="/flashcards" style={{ textDecoration: 'none' }}>
            <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" style={{ animationDelay: '0.1s' }} hoverable>
              <div className="feature-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="16" y="16" width="32" height="40" rx="3" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="2"/>
                  <rect x="10" y="12" width="32" height="40" rx="3" fill="#A5D6A7" stroke="#2E7D32" strokeWidth="2"/>
                  <rect x="18" y="22" width="16" height="3" rx="1.5" fill="#2E7D32"/>
                  <rect x="18" y="30" width="20" height="2" rx="1" fill="#2E7D32"/>
                  <rect x="18" y="36" width="18" height="2" rx="1" fill="#2E7D32"/>
                </svg>
              </div>
              <h3 className="feature-title">Practice Flashcards</h3>
              <p className="feature-description">
                Practice with multiple game modes: flashcards, multiple choice, and more.
              </p>
            </Card>
          </Link>

          <Link to="/progress" style={{ textDecoration: 'none' }}>
            <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" style={{ animationDelay: '0.2s' }} hoverable>
              <div className="feature-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="14" y="44" width="8" height="12" rx="2" fill="#FFF3E0" stroke="#E65100" strokeWidth="2"/>
                  <rect x="28" y="32" width="8" height="24" rx="2" fill="#FFE0B2" stroke="#E65100" strokeWidth="2"/>
                  <rect x="42" y="20" width="8" height="36" rx="2" fill="#FFCC80" stroke="#E65100" strokeWidth="2"/>
                  <path d="M10 16 L22 28 L34 22 L54 12" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="16" r="3" fill="#E65100"/>
                  <circle cx="22" cy="28" r="3" fill="#E65100"/>
                  <circle cx="34" cy="22" r="3" fill="#E65100"/>
                  <circle cx="54" cy="12" r="3" fill="#E65100"/>
                </svg>
              </div>
              <h3 className="feature-title">Track Your Progress</h3>
              <p className="feature-description">
                Monitor your learning journey with detailed statistics and progress tracking.
              </p>
            </Card>
          </Link>

          <Link to="/word-lists" style={{ textDecoration: 'none' }}>
            <Card variant="elevated" padding="lg" className="feature-card animate-fade-in-up" style={{ animationDelay: '0.3s' }} hoverable>
              <div className="feature-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="12" y="10" width="40" height="44" rx="3" fill="#F3E5F5" stroke="#6A1B9A" strokeWidth="2"/>
                  <circle cx="20" cy="22" r="3" fill="none" stroke="#6A1B9A" strokeWidth="2"/>
                  <path d="M18 22 L19.5 23.5 L22 20" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="28" y1="22" x2="44" y2="22" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="20" cy="32" r="3" fill="none" stroke="#6A1B9A" strokeWidth="2"/>
                  <line x1="28" y1="32" x2="44" y2="32" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="20" cy="42" r="3" fill="none" stroke="#6A1B9A" strokeWidth="2"/>
                  <line x1="28" y1="42" x2="44" y2="42" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Create Custom Words Lists</h3>
              <p className="feature-description">
                Create personalized word lists to focus on the vocabulary you need most.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing

