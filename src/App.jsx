import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Landing from './pages/Landing'
import Dictionary from './pages/Dictionary'
import Flashcards from './pages/Flashcards'
import Progress from './pages/Progress'
import About from './pages/About'
import './App.css'

function App() {
  // Always start with Landing page
  const [currentPage, setCurrentPage] = useState(0)
  const pages = [Landing, Dictionary, Flashcards, Progress, About]

  // Sync URL on mount
  useEffect(() => {
    window.history.replaceState({}, '', '/')
  }, [])

  useEffect(() => {
    let isScrolling = false
    let scrollTimeout

    const handleWheel = (e) => {
      if (isScrolling) return

      // Check if we're scrolling inside a scrollable section
      const target = e.target
      const scrollSection = target.closest('.scroll-section')
      if (scrollSection) {
        const { scrollTop, scrollHeight, clientHeight } = scrollSection
        const isAtTop = scrollTop <= 5
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5

        // Only trigger page change if at boundaries
        if (e.deltaY > 0 && !isAtBottom) {
          // Allow normal scrolling inside section
          return
        }
        if (e.deltaY < 0 && !isAtTop) {
          // Allow normal scrolling inside section
          return
        }
      }

      // Prevent default scroll behavior for page switching
      e.preventDefault()

      // Determine scroll direction - make it very sensitive
      const delta = e.deltaY
      const threshold = 10 // Very low threshold for quick switching

      if (Math.abs(delta) < threshold) return

      isScrolling = true

      if (delta > 0 && currentPage < pages.length - 1) {
        // Scroll down
        setCurrentPage((prev) => prev + 1)
      } else if (delta < 0 && currentPage > 0) {
        // Scroll up
        setCurrentPage((prev) => prev - 1)
      }

      // Reset scrolling flag after animation (faster)
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 500)
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
              <PageComponent isActive={index === currentPage} />
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App

