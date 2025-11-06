import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Landing from './pages/Landing'
import Dictionary from './pages/Dictionary'
import Flashcards from './pages/Flashcards'
import Progress from './pages/Progress'
import About from './pages/About'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
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

