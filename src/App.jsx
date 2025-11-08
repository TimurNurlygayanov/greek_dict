import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// Lazy load page components for better performance
const Landing = lazy(() => import('./pages/Landing'))
const Dictionary = lazy(() => import('./pages/Dictionary'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const Progress = lazy(() => import('./pages/Progress'))
const WordLists = lazy(() => import('./pages/WordLists'))
const About = lazy(() => import('./pages/About'))

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    color: 'var(--color-text-secondary)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid var(--color-gray-300)',
        borderTopColor: 'var(--color-primary-500)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 16px'
      }} />
      <div>Loading...</div>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dictionary" element={<Dictionary />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/word-lists" element={<WordLists />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App

