import { useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { setUserId, getUserId, clearWordListsCache } from '../utils/storage'
import { preloadWordLists } from '../utils/wordLists'
import Button from './common/Button'
import './GoogleAuth.css'

const GoogleAuth = ({ onSuccess }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const userId = getUserId()
    // If userId doesn't start with 'user_', it's a Google ID (authenticated)
    if (userId && !userId.startsWith('user_')) {
      setIsAuthenticated(true)
      // Try to get user profile from localStorage
      const storedProfile = localStorage.getItem('ellinaki_user_profile')
      if (storedProfile) {
        try {
          setUserProfile(JSON.parse(storedProfile))
        } catch (e) {
          console.error('Error parsing stored profile:', e)
        }
      }

      // Preload word lists if user is already authenticated
      console.log('User already authenticated - preloading word lists')
      preloadWordLists()
    }
  }, [])

  // Get user profile from Google
  useEffect(() => {
    if (user) {
      fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          Accept: 'application/json'
        }
      })
        .then((res) => res.json())
        .then(async (data) => {
          setUserProfile(data)
          // Store profile in localStorage
          localStorage.setItem('ellinaki_user_profile', JSON.stringify(data))
          // Use Google ID as userId
          setUserId(data.id)
          setIsAuthenticated(true)

          // Preload word lists in background for fast access later
          console.log('Preloading word lists after authentication')
          await preloadWordLists()

          // Call onSuccess callback if provided (e.g., to close auth modal)
          if (onSuccess) {
            onSuccess()
          }
        })
        .catch((err) => {
          console.error('Error fetching user profile:', err)
        })
    }
  }, [user, onSuccess])

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setUser(tokenResponse)
    },
    onError: (error) => {
      console.error('Google login error:', error)
      alert('Failed to sign in with Google. Please try again.')
    }
  })

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setUser(null)
    setUserProfile(null)
    // Clear stored data
    localStorage.removeItem('ellinaki_user_profile')
    // Reset to temporary user ID
    localStorage.removeItem('ellinaki_user_id')
    // Clear word lists cache
    clearWordListsCache()
    // Reload page to reset state
    window.location.reload()
  }

  if (isAuthenticated && userProfile) {
    return (
      <div className="google-auth compact">
        {userProfile.picture && (
          <img src={userProfile.picture} alt="Profile" className="user-avatar" />
        )}
        <Button
          onClick={handleSignOut}
          variant="secondary"
          size="sm"
          title="Sign Out"
        >
          Logout
        </Button>
      </div>
    )
  }

  const googleIcon = (
    <svg className="google-icon" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
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
  )

  return (
    <div className="google-auth">
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        size="sm"
        icon={googleIcon}
      >
        Sign in
      </Button>
    </div>
  )
}

export default GoogleAuth

