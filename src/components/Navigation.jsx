import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

const Navigation = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Ellinaki
        </Link>
        <div className="nav-links">
          <Link
            to="/dictionary"
            className={`nav-link ${isActive('/dictionary') ? 'active' : ''}`}
          >
            Dictionary
          </Link>
          <Link
            to="/flashcards"
            className={`nav-link ${isActive('/flashcards') ? 'active' : ''}`}
          >
            Flashcards
          </Link>
          <Link
            to="/progress"
            className={`nav-link ${isActive('/progress') ? 'active' : ''}`}
          >
            Progress
          </Link>
          <Link
            to="/about"
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

