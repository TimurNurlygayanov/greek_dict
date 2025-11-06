import { useState, useEffect, useMemo } from 'react'
import dictionaryData from '../dictionary.json'
import './Dictionary.css'

const Dictionary = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWord, setSelectedWord] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return []
    }

    const term = searchTerm.toLowerCase().trim()
    return dictionaryData
      .filter(
        (word) =>
          word.greek.toLowerCase().includes(term) ||
          word.english.toLowerCase().includes(term)
      )
      .slice(0, 10)
  }, [searchTerm])

  useEffect(() => {
    setSuggestions(filteredSuggestions)
  }, [filteredSuggestions])

  const handleSuggestionClick = (word) => {
    setSelectedWord(word)
    setSearchTerm(word.greek)
    setSuggestions([])
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setSelectedWord(null)
  }

  return (
    <div className="dictionary">
      <h1 className="page-title">Dictionary</h1>
      <div className="dictionary-search">
        <input
          type="text"
          className="dictionary-input"
          placeholder="Start typing a word in Greek or English..."
          value={searchTerm}
          onChange={handleInputChange}
          autoFocus
        />
        {suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((word, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(word)}
              >
                <div className="suggestion-greek">{word.greek}</div>
                <div className="suggestion-english">{word.english}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWord && (
        <div className="word-result">
          <div className="word-result-greek">{selectedWord.greek}</div>
          <div className="word-result-english">{selectedWord.english}</div>
        </div>
      )}

      {!selectedWord && searchTerm && suggestions.length === 0 && (
        <div className="no-results">No words found. Try a different search.</div>
      )}
    </div>
  )
}

export default Dictionary

