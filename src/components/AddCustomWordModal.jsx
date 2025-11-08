import { useState, useEffect } from 'react'
import { addCustomWord, translateText } from '../utils/customWords'
import Modal from './common/Modal'
import Button from './common/Button'
import Input from './common/Input'
import Badge from './common/Badge'

const AddCustomWordModal = ({ initialSearchTerm = '', onClose, onSuccess }) => {
  const [searchingFor, setSearchingFor] = useState('english') // 'english' or 'greek'
  const [greekText, setGreekText] = useState('')
  const [englishText, setEnglishText] = useState('')
  const [pos, setPos] = useState('')
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translationError, setTranslationError] = useState(null)

  useEffect(() => {
    // Auto-detect if search term is Greek or English
    const isGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(initialSearchTerm)

    if (isGreek) {
      setSearchingFor('greek')
      setGreekText(initialSearchTerm)
      // Auto-translate Greek to English
      autoTranslate(initialSearchTerm, 'el', 'en')
    } else {
      setSearchingFor('english')
      setEnglishText(initialSearchTerm)
      // Auto-translate English to Greek
      autoTranslate(initialSearchTerm, 'en', 'el')
    }
  }, [initialSearchTerm])

  const autoTranslate = async (text, from, to) => {
    if (!text.trim()) return

    setTranslating(true)
    setTranslationError(null)

    try {
      const result = await translateText(text.trim(), from, to)

      if (result.error) {
        setTranslationError(result.error)
      } else if (result.translation) {
        if (to === 'el') {
          setGreekText(result.translation)
        } else {
          setEnglishText(result.translation)
        }
      }
    } catch (error) {
      setTranslationError('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const handleRetryTranslation = () => {
    const isGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(greekText)

    if (searchingFor === 'greek' && greekText.trim()) {
      autoTranslate(greekText, 'el', 'en')
    } else if (searchingFor === 'english' && englishText.trim()) {
      autoTranslate(englishText, 'en', 'el')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!greekText.trim() || !englishText.trim()) {
      alert('Please provide both Greek and English text')
      return
    }

    setLoading(true)
    try {
      const newWord = await addCustomWord(greekText, englishText, pos)
      if (onSuccess) onSuccess(newWord)
      onClose()
    } catch (error) {
      alert(error.message || 'Failed to add custom word')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add Custom Word"
      size="md"
    >
      <div className="mb-4">
        <p className="text-sm text-secondary mb-2">
          Can't find "{initialSearchTerm}" in our dictionary? Add it to your personal dictionary!
        </p>
        {translationError && (
          <div className="p-3 rounded-lg bg-warning-50 border border-warning-300 text-sm mb-2">
            <div className="flex items-center justify-between gap-3">
              <span>{translationError}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetryTranslation}
                disabled={translating}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Greek Word {searchingFor === 'greek' && <Badge variant="info" size="sm">Original search</Badge>}
          </label>
          <Input
            type="text"
            placeholder="Enter Greek word"
            value={greekText}
            onChange={(e) => setGreekText(e.target.value)}
            disabled={translating}
            required
            fullWidth
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            English Translation {searchingFor === 'english' && <Badge variant="info" size="sm">Original search</Badge>}
          </label>
          <Input
            type="text"
            placeholder="Enter English translation"
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
            disabled={translating}
            required
            fullWidth
          />
          {translating && (
            <p className="text-xs text-secondary mt-1">Translating...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Part of Speech (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g., noun, verb, adjective"
            value={pos}
            onChange={(e) => setPos(e.target.value)}
            disabled={loading}
            maxLength={50}
            fullWidth
          />
        </div>

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
            disabled={loading || translating || !greekText.trim() || !englishText.trim()}
            loading={loading}
          >
            Add Word
          </Button>
        </div>
      </form>

      <div className="mt-4 p-3 rounded-lg bg-info-50">
        <p className="text-xs text-info-900">
          💡 Custom words are saved to your personal dictionary and can be used in lists and practice, just like regular words.
        </p>
      </div>
    </Modal>
  )
}

export default AddCustomWordModal
