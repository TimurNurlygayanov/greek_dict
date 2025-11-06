import { useState, useEffect } from 'react'
import { getUserLists, createList, deleteList, removeWordFromList, unmarkWordAsLearned } from '../utils/wordLists'
import { getUserId } from '../utils/storage'
import AuthModal from '../components/AuthModal'
import './WordLists.css'

const WordLists = () => {
  const [lists, setLists] = useState([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState(null)
  const [editingListName, setEditingListName] = useState('')
  const [selectedListModal, setSelectedListModal] = useState(null)

  useEffect(() => {
    const userId = getUserId()
    console.log('WordLists mount - userId:', userId)
    if (!userId || userId.startsWith('user_')) {
      setShowAuthModal(true)
    } else {
      loadLists()
    }
  }, [])

  // Reload lists when auth modal is closed
  useEffect(() => {
    if (!showAuthModal) {
      const userId = getUserId()
      console.log('Auth modal closed - userId:', userId)
      if (userId && !userId.startsWith('user_')) {
        loadLists()
      }
    }
  }, [showAuthModal])

  const loadLists = async () => {
    try {
      const userLists = await getUserLists()
      console.log('Loaded lists:', userLists)
      
      // Sort: custom first, then default
      const customLists = userLists.filter(list => !list.isDefault).sort((a, b) => a.name.localeCompare(b.name))
      const defaultLists = userLists.filter(list => list.isDefault).sort((a, b) => a.name.localeCompare(b.name))
      
      setLists([...customLists, ...defaultLists])
    } catch (error) {
      console.error('Error loading lists:', error)
      setLists([])
    }
  }

  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    const userId = getUserId()
    console.log('Auth modal closed - userId:', userId)
    if (userId && !userId.startsWith('user_')) {
      loadLists()
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    try {
      await createList(newListName.trim())
      setNewListName('')
      setShowCreateForm(false)
      await loadLists()
    } catch (error) {
      alert(error.message || 'Failed to create list')
    }
  }

  const handleDeleteList = async (listId) => {
    const list = lists.find(l => l.id === listId)
    const isDefault = list?.isDefault || listId === 'unstudied' || listId === 'learned'
    
    if (isDefault) {
      alert('Cannot delete default lists')
      return
    }

    if (!confirm(`Are you sure you want to delete "${list?.name}"?`)) {
      return
    }

    try {
      await deleteList(listId)
      await loadLists()
    } catch (error) {
      alert(error.message || 'Failed to delete list')
    }
  }

  const handleStartRename = (list) => {
    setEditingListId(list.id)
    setEditingListName(list.name)
  }

  const handleCancelRename = () => {
    setEditingListId(null)
    setEditingListName('')
  }

  const handleSaveRename = async (listId) => {
    if (!editingListName.trim()) {
      alert('List name cannot be empty')
      return
    }

    try {
      const userId = getUserId()
      const response = await fetch(`/api/lists/${userId}/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editingListName.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to rename list')
      }

      setEditingListId(null)
      setEditingListName('')
      await loadLists()
    } catch (error) {
      alert(error.message || 'Failed to rename list')
    }
  }

  const handleRemoveWord = async (listId, wordGreek) => {
    const list = lists.find(l => l.id === listId)
    const isLearnedList = listId === 'learned'
    
    if (!confirm(isLearnedList ? 'Remove this word from learned words? (This will unlearn it)' : 'Remove this word from the list?')) {
      return
    }

    try {
      await removeWordFromList(listId, wordGreek)
      
      // If removing from "Learned Words" list, unmark as learned in all lists
      if (isLearnedList) {
        const allLists = await getUserLists()
        for (const list of allLists) {
          if (list.learnedWords.includes(wordGreek)) {
            await unmarkWordAsLearned(list.id, wordGreek)
          }
        }
      }
      
      await loadLists()
      // Update modal if it's open
      if (selectedListModal?.id === listId) {
        const updatedLists = await getUserLists()
        const updatedList = updatedLists.find(l => l.id === listId)
        if (updatedList) {
          setSelectedListModal(updatedList)
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to remove word')
    }
  }

  const handleListClick = async (list) => {
    // Load fresh list data
    const allLists = await getUserLists()
    const freshList = allLists.find(l => l.id === list.id)
    if (freshList) {
      setSelectedListModal(freshList)
    }
  }

  return (
    <div className="word-lists">
      {showAuthModal && <AuthModal onClose={handleAuthModalClose} />}
      <div className="word-lists-header">
        <h2>Your Lists</h2>
        <button 
          className="create-list-button"
          onClick={() => setShowCreateForm(true)}
        >
          +
        </button>
      </div>

      {showCreateForm && (
        <div className="create-list-form-card">
          <form onSubmit={handleCreateList}>
            <input
              type="text"
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="list-name-input"
              autoFocus
              maxLength={50}
            />
            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={!newListName.trim()}>
                Create
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewListName('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="no-lists-message">
          <p>You don't have any word lists yet.</p>
          <p>Create your first list to start organizing words!</p>
        </div>
      ) : (
        <div className="lists-container">
            {lists
              .sort((a, b) => {
                // Sort: custom lists first, then default lists
                const aIsDefault = a.isDefault || a.id === 'unstudied' || a.id === 'learned'
                const bIsDefault = b.isDefault || b.id === 'unstudied' || b.id === 'learned'
                if (aIsDefault && !bIsDefault) return 1
                if (!aIsDefault && bIsDefault) return -1
                return 0
              })
              .map((list) => {
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
              const isEditing = editingListId === list.id

              return (
                <div 
                  key={list.id} 
                  className="list-card"
                  onClick={() => handleListClick(list)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="list-card-header">
                    <div className="list-card-title-section">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingListName}
                          onChange={(e) => setEditingListName(e.target.value)}
                          className="list-name-edit-input"
                          autoFocus
                          onBlur={() => handleSaveRename(list.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename(list.id)
                            } else if (e.key === 'Escape') {
                              handleCancelRename()
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="list-card-name">
                          {list.name}
                          {isDefault && <span className="default-badge">Default</span>}
                        </h3>
                      )}
                      <div className="list-card-stats">
                        {list.words.length} word{list.words.length !== 1 ? 's' : ''}
                        {list.learnedWords.length > 0 && (
                          <span className="learned-count">
                            • {list.learnedWords.length} learned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                      {!isDefault && !isEditing && (
                        <>
                          <button
                            className="action-button rename-button"
                            onClick={() => handleStartRename(list)}
                            title="Rename list"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDeleteList(list.id)}
                            title="Delete list"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {selectedListModal && (
        <div className="list-modal-overlay" onClick={() => setSelectedListModal(null)}>
          <div className="list-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="list-modal-header">
              <h2>{selectedListModal.name}</h2>
              <button 
                className="list-modal-close"
                onClick={() => setSelectedListModal(null)}
              >
                ×
              </button>
            </div>
            <div className="list-modal-body">
              {selectedListModal.words.length === 0 ? (
                <div className="empty-list-message">
                  This list is empty. Add words from the Dictionary!
                </div>
              ) : (
                <div className="words-list">
                  {selectedListModal.words.map((word, index) => {
                    const isLearned = selectedListModal.learnedWords.includes(word.greek)
                    return (
                      <div key={index} className={`word-item ${isLearned ? 'learned' : ''}`}>
                        <div className="word-info">
                          <div className="word-greek">{word.greek}</div>
                          {word.pos && <div className="word-pos">{word.pos}</div>}
                          <div className="word-english">{word.english}</div>
                          {isLearned && <span className="learned-badge">✓ Learned</span>}
                        </div>
                        <button
                          className="remove-word-button"
                          onClick={() => handleRemoveWord(selectedListModal.id, word.greek)}
                          title="Remove from list"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WordLists


