import Modal from './common/Modal'
import GoogleAuth from './GoogleAuth'

const AuthModal = ({ onClose, onSuccess }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Authorization Required"
      size="md"
      closeOnOverlayClick={false}
      closeOnEsc={true}
    >
      <div style={{ textAlign: 'center' }}>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
          To save your progress and learning statistics, you need to authorize.
          We will never send you emails or use your data in any other way.
        </p>
        <GoogleAuth onSuccess={onSuccess} />
      </div>
    </Modal>
  )
}

export default AuthModal

