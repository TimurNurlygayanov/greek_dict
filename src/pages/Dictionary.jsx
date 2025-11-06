import { useState, useEffect, useMemo, useRef } from 'react'
import dictionaryData from '../dictionary.json'
import AddToListModal from '../components/AddToListModal'
import GreekDecoration from '../components/GreekDecoration'
import { addWordToList } from '../utils/wordLists'
import { getUserId } from '../utils/storage'
import './Dictionary.css'

const Dictionary = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWord, setSelectedWord] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const inputRef = useRef(null)

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return []
    }

    const term = searchTerm.toLowerCase().trim()
    return dictionaryData
      .filter(
        (word) =>
          word.greek.toLowerCase().includes(term) ||
          (word.greek_normalized && word.greek_normalized.toLowerCase().includes(term)) ||
          word.english.toLowerCase().includes(term)
      )
      .slice(0, 10)
  }, [searchTerm])

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
    
    // Add word to "Unstudied Words" if user views it (tracks words user is interested in)
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
    // Clear suggestions when user starts typing again
    setSuggestions([])
  }

  return (
    <div className="dictionary">
      <div className="dictionary-header">
        <GreekDecoration type="scroll" size="small" />
        <h1 className="page-title">Dictionary</h1>
        <GreekDecoration type="scroll" size="small" />
      </div>
      <div className="dictionary-search">
        <input
          ref={inputRef}
          type="text"
          className="dictionary-input"
          placeholder="Start typing a word in Greek or English..."
          value={searchTerm}
          onChange={handleInputChange}
          autoFocus
        />
        {suggestions.length > 0 && !selectedWord && (
          <div className="suggestions-list">
            {suggestions.map((word, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(word)}
              >
                <div className="suggestion-greek">{word.greek}</div>
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
        <div className="word-result">
          <div className="word-result-greek">{selectedWord.greek}</div>
          {selectedWord.pos && (
            <div className="word-result-pos">{selectedWord.pos}</div>
          )}
          <div className="word-result-english">{selectedWord.english}</div>
          <button 
            className="add-to-list-button"
            onClick={() => setShowAddToListModal(true)}
          >
            + Add to List
          </button>
        </div>
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

