import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Landing from './pages/Landing'
import Dictionary from './pages/Dictionary'
import Flashcards from './pages/Flashcards'
import Progress from './pages/Progress'
import About from './pages/About'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState(0)
  const pages = [Landing, Dictionary, Flashcards, Progress, About]

  useEffect(() => {
    let isScrolling = false
    let scrollTimeout
    let lastScrollTime = 0

    const handleWheel = (e) => {
      // Throttle scroll events
      const now = Date.now()
      if (now - lastScrollTime < 100) return
      lastScrollTime = now

      if (isScrolling) return

      // Check if we're scrolling inside a scrollable section
      const target = e.target
      const scrollSection = target.closest('.scroll-section')
      if (scrollSection) {
        const { scrollTop, scrollHeight, clientHeight } = scrollSection
        const isAtTop = scrollTop === 0
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10

        // Only trigger page change if at boundaries
        if (e.deltaY > 0 && !isAtBottom) return // Scrolling down but not at bottom
        if (e.deltaY < 0 && !isAtTop) return // Scrolling up but not at top
      }

      // Prevent default scroll behavior
      e.preventDefault()

      // Determine scroll direction
      const delta = e.deltaY
      const threshold = 50 // Minimum scroll amount to trigger page change

      if (Math.abs(delta) < threshold) return

      isScrolling = true

      if (delta > 0 && currentPage < pages.length - 1) {
        // Scroll down
        setCurrentPage((prev) => prev + 1)
      } else if (delta < 0 && currentPage > 0) {
        // Scroll up
        setCurrentPage((prev) => prev - 1)
      }

      // Reset scrolling flag after animation
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 800)
    }

    const handleNavigate = (e) => {
      setCurrentPage(e.detail)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('navigateToPage', handleNavigate)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('navigateToPage', handleNavigate)
      clearTimeout(scrollTimeout)
    }
  }, [currentPage, pages.length])

  // Update URL without navigation
  useEffect(() => {
    const paths = ['/', '/dictionary', '/flashcards', '/progress', '/about']
    window.history.pushState({}, '', paths[currentPage])
  }, [currentPage])

  const CurrentPageComponent = pages[currentPage]

  return (
    <div className="app">
      <Navigation />
      <main className="main-content scroll-container">
        <div 
          className="scroll-wrapper"
          style={{ transform: `translateY(-${currentPage * 100}vh)` }}
        >
          {pages.map((PageComponent, index) => (
            <section key={index} className="scroll-section">
              <PageComponent />
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App

