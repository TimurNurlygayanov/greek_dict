import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import Landing from './pages/Landing'
import Dictionary from './pages/Dictionary'
import Flashcards from './pages/Flashcards'
import Progress from './pages/Progress'
import About from './pages/About'
import './App.css'

const pageRoutes = ['/', '/dictionary', '/flashcards', '/progress', '/about']

function ScrollHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let isScrolling = false
    let scrollTimeout

    const handleWheel = (e) => {
      if (isScrolling) return

      // Check if we're scrolling inside a scrollable element (like input, textarea, etc.)
      const target = e.target
      const isScrollableElement = target.tagName === 'INPUT' || 
                                  target.tagName === 'TEXTAREA' ||
                                  target.closest('.suggestions-list') ||
                                  target.closest('.scrollable-content')
      
      if (isScrollableElement) {
        // Allow normal scrolling inside these elements
        return
      }

      // Prevent default scroll behavior
      e.preventDefault()

      const delta = e.deltaY
      const threshold = 20 // Small threshold for quick switching

      if (Math.abs(delta) < threshold) return

      isScrolling = true

      const currentIndex = pageRoutes.indexOf(location.pathname)
      
      if (delta > 0 && currentIndex < pageRoutes.length - 1) {
        // Scroll down - navigate to next page
        navigate(pageRoutes[currentIndex + 1])
      } else if (delta < 0 && currentIndex > 0) {
        // Scroll up - navigate to previous page
        navigate(pageRoutes[currentIndex - 1])
      }

      // Reset scrolling flag
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 300)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      clearTimeout(scrollTimeout)
    }
  }, [navigate, location.pathname])

  return null
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <ScrollHandler />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

