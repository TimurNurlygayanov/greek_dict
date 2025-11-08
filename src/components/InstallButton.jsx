import { useInstallPrompt } from '../hooks/useInstallPrompt'
import Button from './common/Button'

const InstallButton = () => {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()

  if (isInstalled || !canInstall) {
    return null
  }

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      console.log('App installed successfully')
    }
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleInstall}
      aria-label="Install Ellinaki as an app"
    >
      📱 Install App
    </Button>
  )
}

export default InstallButton
