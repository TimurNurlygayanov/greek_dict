import { useState } from 'react'
import Modal from './common/Modal'
import Button from './common/Button'
import Input from './common/Input'
import { getUserId } from '../utils/storage'

const API_BASE = ''

const UploadWordsModal = ({ onClose, onSuccess }) => {
  const [listName, setListName] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Check file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please upload a CSV or Excel file')
        setFile(null)
      }
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!listName.trim()) {
      setError('Please provide a list name')
      return
    }

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userId = await getUserId()
      if (!userId) throw new Error('User not authenticated')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('listName', listName.trim())

      const response = await fetch(`${API_BASE}/api/custom-words/${userId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const data = await response.json()

      if (onSuccess) {
        onSuccess(data)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Upload Custom Words"
      size="md"
    >
      <div className="mb-4">
        <p className="text-sm text-secondary mb-3">
          Upload a CSV or Excel file with your custom words. The file should have two columns:
        </p>
        <div className="p-3 rounded-lg bg-info-50 border border-info-300 text-sm mb-3">
          <div className="font-semibold mb-2">File Format:</div>
          <ul className="list-disc ml-5 space-y-1 text-info-900">
            <li><strong>Column 1:</strong> Greek word</li>
            <li><strong>Column 2:</strong> English translation</li>
          </ul>
          <div className="mt-3 font-semibold">Example:</div>
          <div className="mt-1 p-2 bg-white rounded border border-info-200 font-mono text-xs">
            γεια σου, hello<br />
            ευχαριστώ, thank you<br />
            παρακαλώ, please
          </div>
        </div>
        <p className="text-xs text-secondary">
          All words will be added to your custom dictionary and organized in a new list.
        </p>
      </div>

      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Words List Name
          </label>
          <Input
            type="text"
            placeholder="e.g., Travel Vocabulary, Business Terms..."
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            maxLength={50}
            required
            fullWidth
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Choose File (CSV or Excel)
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="file-upload"
            style={{
              display: 'block',
              padding: 'var(--space-4)',
              borderRadius: 'var(--border-radius-md)',
              border: '2px dashed var(--color-primary-300)',
              backgroundColor: 'var(--color-primary-50)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              color: 'var(--color-primary-700)',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-100)'
              e.currentTarget.style.borderColor = 'var(--color-primary-500)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'
              e.currentTarget.style.borderColor = 'var(--color-primary-300)'
            }}
          >
            {file ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{file.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success-600)', marginTop: '4px' }}>✓ File selected</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📤</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>Click to upload file</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>CSV or Excel (.csv, .xlsx, .xls)</div>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-300 text-sm text-danger-800">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !file || !listName.trim()}
            loading={loading}
          >
            Upload & Create List
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default UploadWordsModal
