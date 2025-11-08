import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'
import GoogleAuth from './GoogleAuth'

const Navigation = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Ellinaki
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-only" aria-label="Main navigation">
          <Link
            to="/dictionary"
            className={`nav-link ${isActive('/dictionary') ? 'active' : ''}`}
            aria-current={isActive('/dictionary') ? 'page' : undefined}
          >
            Dictionary
          </Link>
          <Link
            to="/flashcards"
            className={`nav-link ${isActive('/flashcards') ? 'active' : ''}`}
            aria-current={isActive('/flashcards') ? 'page' : undefined}
          >
            Flashcards
          </Link>
          <Link
            to="/progress"
            className={`nav-link ${isActive('/progress') ? 'active' : ''}`}
            aria-current={isActive('/progress') ? 'page' : undefined}
          >
            Progress
          </Link>
          <Link
            to="/word-lists"
            className={`nav-link ${isActive('/word-lists') ? 'active' : ''}`}
            aria-current={isActive('/word-lists') ? 'page' : undefined}
          >
            Words Lists
          </Link>
        </nav>

        <div className="nav-right">
          <div className="desktop-only">
            <GoogleAuth />
          </div>

          {/* Hamburger Menu Button */}
          <button
            className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu} />
      )}

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="mobile-menu-header">
          <GoogleAuth />
        </div>
        <nav className="mobile-menu-links" aria-label="Main menu">
          <Link
            to="/dictionary"
            className={`mobile-nav-link ${isActive('/dictionary') ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">📚</span>
            Dictionary
          </Link>
          <Link
            to="/flashcards"
            className={`mobile-nav-link ${isActive('/flashcards') ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">🎮</span>
            Flashcards
          </Link>
          <Link
            to="/progress"
            className={`mobile-nav-link ${isActive('/progress') ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">📊</span>
            Progress
          </Link>
          <Link
            to="/word-lists"
            className={`mobile-nav-link ${isActive('/word-lists') ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">📝</span>
            Words Lists
          </Link>
        </nav>
      </div>
    </nav>
  )
}

export default Navigation

