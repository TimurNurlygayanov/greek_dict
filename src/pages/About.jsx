import './About.css'

const About = () => {
  return (
    <div className="about">
      <h1 className="page-title">About</h1>
      <div className="about-content">
        <div className="about-card">
          <p className="about-description">
            Learn Greek words easily. All the words you need to know for B2 Greek exams.
          </p>
          
          <div className="about-section">
            <h3>Created by</h3>
            <p>
              <a 
                href="https://www.linkedin.com/in/timur-nurlygaianov/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="about-link"
              >
                Timur Nurlygaianov
              </a>
            </p>
          </div>

          <div className="about-section">
            <h3>Features</h3>
            <ul className="about-features">
              <li>Interactive dictionary with search functionality</li>
              <li>Three different flashcard game modes</li>
              <li>Progress tracking for daily exercises</li>
              <li>Word memorization statistics</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Authentication & Privacy</h3>
            <p>
              To track your learning progress and support creating word lists for study, 
              we ask users to authenticate through their Google account. Your data will 
              never be used for any purpose other than saving your learning progress. 
              We will never send you emails or use your information in any other way.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About

