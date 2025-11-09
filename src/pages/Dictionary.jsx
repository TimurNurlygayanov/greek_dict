import { useState, useEffect, useMemo, useRef } from 'react'
import dictionaryData from '../dictionary.json'
import AddToListModal from '../components/AddToListModal'
import AddCustomWordModal from '../components/AddCustomWordModal'
import GreekDecoration from '../components/GreekDecoration'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import { getCustomWords } from '../utils/customWords'
import './Dictionary.css'

const Dictionary = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWord, setSelectedWord] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [showAddCustomWordModal, setShowAddCustomWordModal] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [customWords, setCustomWords] = useState([])
  const inputRef = useRef(null)
  const [showGuide, setShowGuide] = useState(true)

  // Load custom words on mount
  useEffect(() => {
    const loadCustomWords = async () => {
      const words = await getCustomWords()
      setCustomWords(words)
    }
    loadCustomWords()
  }, [])

  const handleDismissGuide = () => {
    setShowGuide(false)
  }

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return []
    }

    const term = searchTerm.toLowerCase().trim()

    // Merge dictionary and custom words
    const allWords = [...dictionaryData, ...customWords]

    return allWords
      .filter(
        (word) => {
          // Filter by search term
          const matchesSearch = word.greek.toLowerCase().includes(term) ||
            (word.greek_normalized && word.greek_normalized.toLowerCase().includes(term)) ||
            word.english.toLowerCase().includes(term)

          return matchesSearch
        }
      )
      .slice(0, 10)
  }, [searchTerm, customWords])

  useEffect(() => {
    // Don't update suggestions if a word is selected
    if (!selectedWord) {
      setSuggestions(filteredSuggestions)
    }
  }, [filteredSuggestions, selectedWord])

  const handleSuggestionClick = async (word) => {
    setSelectedWord(word)
    setSearchTerm(word.greek)
    setSuggestions([])
    // Remove focus from input field
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setSelectedWord(null)
    setHighlightedIndex(-1)
    // Clear suggestions when user starts typing again
    setSuggestions([])
    // Hide guide when user starts interacting with the field
    if (showGuide) {
      handleDismissGuide()
    }
  }

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setSuggestions([])
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  const getLevelBadgeVariant = (level) => {
    const variants = {
      'A1': 'success',
      'A2': 'info',
      'B1': 'warning',
      'B2': 'danger'
    }
    return variants[level] || 'default'
  }

  return (
    <div className="dictionary">
      <div className="dictionary-search">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Start typing a word in Greek or English..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
          fullWidth
          size="lg"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={suggestions.length > 0 && !selectedWord}
          aria-activedescendant={
            highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
          }
        />
        {suggestions.length > 0 && !selectedWord && (
          <div
            id="search-suggestions"
            className="suggestions-list"
            role="listbox"
            aria-label="Search suggestions"
          >
            {suggestions.map((word, index) => (
              <div
                key={index}
                id={`suggestion-${index}`}
                className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
                onClick={() => handleSuggestionClick(word)}
                role="option"
                aria-selected={highlightedIndex === index}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div style={{ flex: 1 }}>
                  <div className="suggestion-greek" style={{ marginBottom: '4px' }}>{word.greek}</div>
                  {word.pos && (
                    <div className="suggestion-pos">{word.pos}</div>
                  )}
                  <div className="suggestion-english">{word.english}</div>
                </div>
                {word.level && (
                  <Badge variant={getLevelBadgeVariant(word.level)} size="sm" style={{ marginLeft: '12px', flexShrink: 0 }}>
                    {word.level}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showGuide && !searchTerm && !selectedWord && (
        <Card
          variant="elevated"
          padding="lg"
          className="animate-fade-in-up"
          style={{
            maxWidth: '600px',
            margin: '2rem auto 0 auto',
            background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
            border: '2px dashed #0066cc',
            position: 'relative'
          }}
        >
          <button
            onClick={handleDismissGuide}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              fontSize: '24px',
              padding: '4px 8px',
              lineHeight: '1',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0066cc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            ×
          </button>

          {/* Arrow pointing up */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{
              fontSize: '3rem',
              transform: 'rotate(180deg)',
              display: 'inline-block',
              animation: 'bounce 2s ease-in-out infinite'
            }}>
              ↓
            </div>
          </div>

          <div style={{ textAlign: 'center', paddingRight: '20px' }}>
            <div style={{
              fontSize: '1.5rem',
              fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
              color: '#0066cc',
              marginBottom: '12px',
              fontWeight: 'bold'
            }}>
              Start here! ✍️
            </div>
            <p style={{
              fontSize: '1rem',
              color: '#555',
              lineHeight: '1.6',
              margin: 0
            }}>
              Type any Greek or English word above to search the dictionary,
              then add words to your lists and practice them with flashcards!
            </p>
          </div>

          <style>
            {`
              @keyframes bounce {
                0%, 100% { transform: rotate(180deg) translateY(0); }
                50% { transform: rotate(180deg) translateY(-10px); }
              }
            `}
          </style>
        </Card>
      )}

      {selectedWord && (
        <Card variant="elevated" padding="xl" className="word-result animate-scale-in">
          <div className="flex items-center gap-3 mb-2" style={{ justifyContent: 'center' }}>
            <div className="word-result-greek">{selectedWord.greek}</div>
          </div>
          {selectedWord.pos && (
            <div className="word-result-pos">{selectedWord.pos}</div>
          )}
          <div className="word-result-english">{selectedWord.english}</div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowAddToListModal(true)}
            icon={<span>+</span>}
            className="add-to-list-button"
          >
            Add to List
          </Button>
        </Card>
      )}

      {showAddToListModal && selectedWord && (
        <AddToListModal
          word={selectedWord}
          onClose={() => setShowAddToListModal(false)}
          onSuccess={() => {
            // Word added successfully
          }}
        />
      )}

      {showAddCustomWordModal && (
        <AddCustomWordModal
          initialSearchTerm={searchTerm}
          onClose={() => setShowAddCustomWordModal(false)}
          onSuccess={async (newWord) => {
            // Reload custom words and select the new word
            const words = await getCustomWords()
            setCustomWords(words)
            setSelectedWord(newWord)
            setSearchTerm(newWord.greek)
          }}
        />
      )}

      {!selectedWord && searchTerm && suggestions.length === 0 && (
        <Card variant="elevated" padding="lg" className="text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="mb-4">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-secondary mb-4" style={{ fontSize: '1.1rem' }}>
              We couldn't find "{searchTerm}" in our dictionary.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowAddCustomWordModal(true)}
          >
            Add as Custom Word
          </Button>
          <p className="text-xs text-secondary mt-6">
            Custom words are saved to your personal dictionary and work just like regular words.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Dictionary

