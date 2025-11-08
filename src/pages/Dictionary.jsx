import { useState, useEffect, useMemo, useRef } from 'react'
import dictionaryData from '../dictionary.json'
import AddToListModal from '../components/AddToListModal'
import GreekDecoration from '../components/GreekDecoration'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import { addWordToList } from '../utils/wordLists'
import { getUserId } from '../utils/storage'
import './Dictionary.css'

const Dictionary = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWord, setSelectedWord] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return []
    }

    const term = searchTerm.toLowerCase().trim()
    return dictionaryData
      .filter(
        (word) => {
          // Filter by search term
          const matchesSearch = word.greek.toLowerCase().includes(term) ||
            (word.greek_normalized && word.greek_normalized.toLowerCase().includes(term)) ||
            word.english.toLowerCase().includes(term)

          // Filter by level
          const matchesLevel = selectedLevel === 'ALL' || word.level === selectedLevel

          return matchesSearch && matchesLevel
        }
      )
      .slice(0, 10)
  }, [searchTerm, selectedLevel])

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
    
    // Add word to "B2 Required Words" if user views it (tracks words user is interested in)
    const userId = getUserId()
    if (userId && !userId.startsWith('user_')) {
      try {
        // Check if word is already in any custom list by trying to add to unstudied
        // Server will handle the logic
        await addWordToList('unstudied', word)
      } catch (error) {
        // Silently fail - word might already be in lists
        console.log('Word might already be in lists')
      }
    }
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setSelectedWord(null)
    setHighlightedIndex(-1)
    // Clear suggestions when user starts typing again
    setSuggestions([])
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
      {/* Level Filter */}
      <div className="mb-6 flex gap-3 flex-wrap" style={{ justifyContent: 'center' }}>
        <Button
          variant={selectedLevel === 'ALL' ? 'primary' : 'outline'}
          size="md"
          onClick={() => setSelectedLevel('ALL')}
        >
          All Levels
        </Button>
        <Button
          variant={selectedLevel === 'A1' ? 'success' : 'outline'}
          size="md"
          onClick={() => setSelectedLevel('A1')}
        >
          A1
        </Button>
        <Button
          variant={selectedLevel === 'A2' ? 'info' : 'outline'}
          size="md"
          onClick={() => setSelectedLevel('A2')}
        >
          A2
        </Button>
        <Button
          variant={selectedLevel === 'B1' ? 'warning' : 'outline'}
          size="md"
          onClick={() => setSelectedLevel('B1')}
        >
          B1
        </Button>
        <Button
          variant={selectedLevel === 'B2' ? 'danger' : 'outline'}
          size="md"
          onClick={() => setSelectedLevel('B2')}
        >
          B2
        </Button>
      </div>

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
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="suggestion-greek">{word.greek}</div>
                  {word.level && (
                    <Badge variant={getLevelBadgeVariant(word.level)} size="sm">
                      {word.level}
                    </Badge>
                  )}
                </div>
                {word.pos && (
                  <div className="suggestion-pos">{word.pos}</div>
                )}
                <div className="suggestion-english">{word.english}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWord && (
        <Card variant="elevated" padding="xl" className="word-result animate-scale-in">
          <div className="flex items-center gap-3 mb-2" style={{ justifyContent: 'center' }}>
            <div className="word-result-greek">{selectedWord.greek}</div>
            {selectedWord.level && (
              <Badge variant={getLevelBadgeVariant(selectedWord.level)} size="md">
                {selectedWord.level}
              </Badge>
            )}
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

      {!selectedWord && searchTerm && suggestions.length === 0 && (
        <div className="no-results">No words found. Try a different search.</div>
      )}
    </div>
  )
}

export default Dictionary

