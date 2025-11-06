import { useEffect, useState } from 'react'
import './Navigation.css'

const Navigation = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname)
    }

    // Listen to popstate for browser back/forward
    window.addEventListener('popstate', updatePath)
    
    // Check path periodically (for programmatic changes)
    const interval = setInterval(updatePath, 100)

    return () => {
      window.removeEventListener('popstate', updatePath)
      clearInterval(interval)
    }
  }, [])

  const navigateTo = (path) => {
    const paths = ['/', '/dictionary', '/flashcards', '/progress', '/about']
    const index = paths.indexOf(path)
    if (index !== -1) {
      window.history.pushState({}, '', path)
      setCurrentPath(path)
      // Trigger scroll by dispatching a custom event
      window.dispatchEvent(new CustomEvent('navigateToPage', { detail: index }))
    }
  }

  const isActive = (path) => currentPath === path

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => navigateTo('/')}>
          Ellinaki
        </div>
        <div className="nav-links">
          <div
            onClick={() => navigateTo('/dictionary')}
            className={`nav-link ${isActive('/dictionary') ? 'active' : ''}`}
          >
            Dictionary
          </div>
          <div
            onClick={() => navigateTo('/flashcards')}
            className={`nav-link ${isActive('/flashcards') ? 'active' : ''}`}
          >
            Flashcards
          </div>
          <div
            onClick={() => navigateTo('/progress')}
            className={`nav-link ${isActive('/progress') ? 'active' : ''}`}
          >
            Progress
          </div>
          <div
            onClick={() => navigateTo('/about')}
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            About
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

