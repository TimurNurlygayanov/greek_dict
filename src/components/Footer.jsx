import { Link } from 'react-router-dom'
import InstallButton from './InstallButton'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Ellinaki</h3>
            <p className="footer-description">
              Master Greek vocabulary for your B2 exam with interactive learning tools.
            </p>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <InstallButton />
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <nav className="footer-links">
              <Link to="/dictionary" className="footer-link">Dictionary</Link>
              <Link to="/flashcards" className="footer-link">Flashcards</Link>
              <Link to="/progress" className="footer-link">Progress</Link>
              <Link to="/word-lists" className="footer-link">Lists</Link>
            </nav>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Learn More</h4>
            <nav className="footer-links">
              <Link to="/about" className="footer-link">About</Link>
            </nav>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Ellinaki. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
