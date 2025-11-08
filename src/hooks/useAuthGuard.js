import { useState, useEffect } from 'react'
import { getUserId } from '../utils/storage'

/**
 * Custom hook to guard routes/features that require authentication
 * Consolidates duplicate auth checking logic from multiple components
 *
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {object} - Auth state and modal control
 */
const useAuthGuard = (requireAuth = true) => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const currentUserId = getUserId()
    setUserId(currentUserId)

    // Check if user is authenticated (not a temporary user)
    const authenticated = currentUserId && !currentUserId.startsWith('user_')
    setIsAuthenticated(authenticated)

    // Show auth modal if authentication is required but user is not authenticated
    if (requireAuth && !authenticated) {
      setShowAuthModal(true)
    }
  }, [requireAuth])

  // Listen for authentication changes (from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ellinaki_user_id') {
        const newUserId = e.newValue
        setUserId(newUserId)

        const authenticated = newUserId && !newUserId.startsWith('user_')
        setIsAuthenticated(authenticated)

        if (requireAuth && !authenticated) {
          setShowAuthModal(true)
        } else if (authenticated) {
          setShowAuthModal(false)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [requireAuth])

  const closeAuthModal = () => {
    setShowAuthModal(false)

    // Re-check auth status after modal close
    const currentUserId = getUserId()
    const authenticated = currentUserId && !currentUserId.startsWith('user_')

    setIsAuthenticated(authenticated)
    setUserId(currentUserId)

    // If still not authenticated and auth is required, show modal again
    if (requireAuth && !authenticated) {
      setShowAuthModal(true)
    }
  }

  return {
    isAuthenticated,
    userId,
    showAuthModal,
    setShowAuthModal,
    closeAuthModal
  }
}

export default useAuthGuard
