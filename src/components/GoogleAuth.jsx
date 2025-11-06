import { useState } from 'react'
import { setUserId } from '../utils/storage'
import './GoogleAuth.css'

// Placeholder component for Google OAuth integration
// To implement: Add Google OAuth client ID and integrate with authentication service
const GoogleAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth flow
    // This is a placeholder for future implementation
    console.log('Google Sign In clicked - OAuth integration needed')
    
    // Example structure for future implementation:
    // window.gapi.load('auth2', () => {
    //   window.gapi.auth2.init({
    //     client_id: 'YOUR_GOOGLE_CLIENT_ID'
    //   }).then(() => {
    //     const authInstance = window.gapi.auth2.getAuthInstance()
    //     authInstance.signIn().then((googleUser) => {
    //       const profile = googleUser.getBasicProfile()
    //       setUser({
    //         name: profile.getName(),
    //         email: profile.getEmail(),
    //         imageUrl: profile.getImageUrl()
    //       })
    //       setIsAuthenticated(true)
    //       // Store user ID for progress tracking
    //       setUserId(profile.getId())
    //     })
    //   })
    // })
  }

  const handleSignOut = () => {
    // TODO: Implement sign out
    setIsAuthenticated(false)
    setUser(null)
  }

  if (isAuthenticated && user) {
    return (
      <div className="google-auth">
        <div className="user-info">
          {user.imageUrl && (
            <img src={user.imageUrl} alt={user.name} className="user-avatar" />
          )}
          <span className="user-name">{user.name}</span>
        </div>
        <button onClick={handleSignOut} className="google-sign-out">
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="google-auth">
      <button onClick={handleGoogleSignIn} className="google-sign-in">
        <svg className="google-icon" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>
      <p className="auth-note">
        Sign in to sync your progress across devices
      </p>
    </div>
  )
}

export default GoogleAuth

