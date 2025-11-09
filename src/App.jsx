import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navigation from './components/Navigation'
import ErrorBoundary from './components/ErrorBoundary'
import Landing from './pages/Landing' // Not lazy-loaded - static content
import './App.css'

// Lazy load page components for better performance
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
            <Routes>
              {/* Landing page loads immediately - no suspense needed */}
              <Route path="/" element={<Landing />} />

              {/* Other pages are lazy-loaded */}
              <Route path="/dictionary" element={
                <Suspense fallback={<PageLoader />}>
                  <Dictionary />
                </Suspense>
              } />
              <Route path="/flashcards" element={
                <Suspense fallback={<PageLoader />}>
                  <Flashcards />
                </Suspense>
              } />
              <Route path="/progress" element={
                <Suspense fallback={<PageLoader />}>
                  <Progress />
                </Suspense>
              } />
              <Route path="/word-lists" element={
                <Suspense fallback={<PageLoader />}>
                  <WordLists />
                </Suspense>
              } />
              <Route path="/about" element={
                <Suspense fallback={<PageLoader />}>
                  <About />
                </Suspense>
              } />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App

