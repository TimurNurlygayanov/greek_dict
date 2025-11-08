import { useState, useEffect } from 'react'

export const useInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default install prompt
      e.preventDefault()
      // Save the event for later use
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return false

    // Show the install prompt
    installPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await installPrompt.userChoice

    // Clear the prompt
    setInstallPrompt(null)

    return outcome === 'accepted'
  }

  return {
    canInstall: !!installPrompt,
    isInstalled,
    promptInstall
  }
}

export default useInstallPrompt
