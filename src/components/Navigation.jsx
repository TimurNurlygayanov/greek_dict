import { useEffect, useState } from 'react'
import './Navigation.css'

const Navigation = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollDirection, setLastScrollDirection] = useState(null)

  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname)
    }

    // Listen to popstate for browser back/forward
    window.addEventListener('popstate', updatePath)
    
    // Check path periodically (for programmatic changes)
    const interval = setInterval(updatePath, 100)

    // Handle scroll to hide/show navigation
    let lastScrollY = window.scrollY
    let scrollTimeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up'
      
      // Clear previous timeout
      clearTimeout(scrollTimeout)
      
      if (scrollDirection === 'down' && currentScrollY > 50) {
        setIsVisible(false)
      } else if (scrollDirection === 'up') {
        setIsVisible(true)
      }
      
      lastScrollY = currentScrollY
    }

    // Listen to wheel events for page navigation
    const handleWheel = (e) => {
      const scrollDirection = e.deltaY > 0 ? 'down' : 'up'
      
      if (scrollDirection !== lastScrollDirection) {
        setLastScrollDirection(scrollDirection)
        
        if (scrollDirection === 'down') {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
      }
    }

    // Listen to page navigation events
    const handlePageChange = () => {
      // Show navigation briefly when page changes, then hide if scrolling down
      setIsVisible(true)
      setTimeout(() => {
        if (lastScrollDirection === 'down') {
          setIsVisible(false)
        }
      }, 500)
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('navigateToPage', handlePageChange)

    return () => {
      window.removeEventListener('popstate', updatePath)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('navigateToPage', handlePageChange)
      clearInterval(interval)
      clearTimeout(scrollTimeout)
    }
  }, [lastScrollDirection])

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
    <nav className={`navigation ${isVisible ? 'visible' : 'hidden'}`}>
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

