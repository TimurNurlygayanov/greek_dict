import { Link } from 'react-router-dom'
import GoogleAuth from '../components/GoogleAuth'
import './Landing.css'

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="landing-title">Ellinaki</h1>
        <h2 className="landing-subtitle">learn greek words easily</h2>
        <p className="landing-description">
          All greek words you should know for B2 Greek exams
        </p>
        <GoogleAuth />
        <div className="landing-actions">
          <Link to="/dictionary" className="landing-button primary">
            Start Learning
          </Link>
          <Link to="/flashcards" className="landing-button secondary">
            Practice with Flashcards
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing

