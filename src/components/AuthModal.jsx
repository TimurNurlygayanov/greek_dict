import { useState } from 'react'
import GoogleAuth from './GoogleAuth'
import './AuthModal.css'

const AuthModal = ({ onClose }) => {
  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        <h2 className="auth-modal-title">Authorization Required</h2>
        <p className="auth-modal-message">
          To save your progress and learning statistics, you need to authorize. 
          We will never send you emails or use your data in any other way.
        </p>
        <GoogleAuth />
      </div>
    </div>
  )
}

export default AuthModal

