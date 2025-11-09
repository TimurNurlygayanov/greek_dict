import { useState } from 'react'
import { createList, deleteList, removeWordFromList, unmarkWordAsLearned, getUserLists, updateListName, addWordToList } from '../utils/wordLists'
import dictionaryData from '../dictionary.json'
import AuthModal from '../components/AuthModal'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import useAuthGuard from '../hooks/useAuthGuard'
import useWordLists from '../hooks/useWordLists'

const WordLists = () => {
  const { showAuthModal, closeAuthModal } = useAuthGuard(true)
  const { lists, refreshLists } = useWordLists(!showAuthModal)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [selectedListModal, setSelectedListModal] = useState(null)
  const [isRenamingModal, setIsRenamingModal] = useState(false)
  const [modalListName, setModalListName] = useState('')
  const [showAddWordsMode, setShowAddWordsMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    try {
      await createList(newListName.trim())
      setNewListName('')
      setShowCreateForm(false)
      await refreshLists()
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
      await refreshLists()
    } catch (error) {
      alert(error.message || 'Failed to delete list')
    }
  }

  const handleStartRenameModal = () => {
    setIsRenamingModal(true)
    setModalListName(selectedListModal.name)
  }

  const handleCancelRenameModal = () => {
    setIsRenamingModal(false)
    setModalListName('')
  }

  const handleSaveRenameModal = async () => {
    if (!modalListName.trim()) {
      alert('List name cannot be empty')
      return
    }

    if (!selectedListModal || selectedListModal.isDefault) {
      alert('Cannot rename default lists')
      return
    }

    try {
      await updateListName(selectedListModal.id, modalListName.trim())
      setIsRenamingModal(false)
      setModalListName('')
      await refreshLists()

      // Update modal data
      const updatedLists = await getUserLists(false)
      const updatedList = updatedLists.find(l => l.id === selectedListModal.id)
      if (updatedList) {
        setSelectedListModal(updatedList)
      }
    } catch (error) {
      alert(error.message || 'Failed to rename list')
    }
  }

  const handleRemoveWord = async (listId, wordGreek) => {
    const list = lists.find(l => l.id === listId)

    // Check if list is read-only
    if (list?.isReadOnly) {
      alert('Cannot remove words from this list. You can practice and mark words as learned.')
      return
    }

    const isLearnedList = listId === 'learned'

    if (!confirm(isLearnedList ? 'Remove this word from learned words? (This will unlearn it)' : 'Remove this word from the list?')) {
      return
    }

    try {
      await removeWordFromList(listId, wordGreek)

      // If removing from "Learned Words" list, unmark as learned in all lists
      if (isLearnedList) {
        const allLists = await getUserLists(false)
        for (const list of allLists) {
          if (list.learnedWords.includes(wordGreek)) {
            await unmarkWordAsLearned(list.id, wordGreek)
          }
        }
      }

      await refreshLists()
      // Update modal if it's open
      if (selectedListModal?.id === listId) {
        const updatedLists = await getUserLists(false)
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
    const allLists = await getUserLists(false)
    const freshList = allLists.find(l => l.id === list.id)
    if (freshList) {
      setSelectedListModal(freshList)
    }
  }

  const handleSearchWords = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const results = dictionaryData
      .filter(word =>
        word.greek.toLowerCase().includes(lowerQuery) ||
        word.english.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20) // Limit to 20 results

    setSearchResults(results)
  }

  const handleAddWordToList = async (word) => {
    if (!selectedListModal) return

    try {
      await addWordToList(selectedListModal.id, word)
      await refreshLists()

      // Update modal data
      const updatedLists = await getUserLists(false)
      const updatedList = updatedLists.find(l => l.id === selectedListModal.id)
      if (updatedList) {
        setSelectedListModal(updatedList)
      }
    } catch (error) {
      alert(error.message || 'Failed to add word to list')
    }
  }

  const handleToggleAddWordsMode = () => {
    setShowAddWordsMode(!showAddWordsMode)
    setSearchQuery('')
    setSearchResults([])
  }

  // Separate custom and default lists
  const customLists = lists.filter(l => !l.isDefault).sort((a, b) => a.name.localeCompare(b.name))
  const defaultLists = lists.filter(l => l.isDefault).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-20)' }}>
      {showAuthModal && <AuthModal onClose={closeAuthModal} />}

      {lists.length === 0 ? (
        <Card variant="elevated" padding="lg" className="text-center">
          <p className="text-lg text-secondary mb-2">You don't have any word lists yet.</p>
          <p className="text-secondary">Create your first list to start organizing words!</p>
        </Card>
      ) : (
        <>
          {/* Custom Lists Section */}
          <div className="card-grid mb-8">
            {customLists.map((list) => {
              const totalWords = list.words.length
              const learnedWords = list.learnedWords.length
              const percentage = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0

              return (
                <Card
                  key={list.id}
                  variant="elevated"
                  padding="md"
                  hoverable
                  onClick={() => handleListClick(list)}
                  className="animate-fade-in-up"
                >
                  <div className="flex-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold" style={{ margin: 0 }}>
                          {list.name}
                        </h3>
                      </div>
                      <div className="text-xs text-secondary mb-2">
                        {learnedWords} / {totalWords} words learned
                      </div>
                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--color-gray-200)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--color-success-500), var(--color-success-600))',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div className="text-xs text-secondary mt-1">
                        {percentage}% complete
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'var(--space-3)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                        title="Delete list"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Create New List Widget */}
            {showCreateForm ? (
              <Card
                variant="elevated"
                padding="md"
                className="animate-scale-in"
                style={{
                  background: 'transparent',
                  border: '3px dashed rgba(255, 255, 255, 0.3)',
                  boxShadow: 'none'
                }}
              >
                <form onSubmit={handleCreateList} className="flex flex-col gap-3">
                  <Input
                    type="text"
                    placeholder="Enter list name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    autoFocus
                    maxLength={50}
                    fullWidth
                  />
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" disabled={!newListName.trim()} fullWidth>
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewListName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card
                variant="elevated"
                padding="md"
                hoverable
                onClick={() => setShowCreateForm(true)}
                className="animate-fade-in-up"
                style={{
                  background: 'transparent',
                  border: '3px dashed rgba(255, 255, 255, 0.3)',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div className="flex flex-col items-center justify-center" style={{ minHeight: '120px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px', opacity: 0.5 }}>+</div>
                  <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500' }}>
                    Create New List
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Separator */}
          {defaultLists.length > 0 && (
            <div style={{
              borderTop: '2px solid rgba(255, 255, 255, 0.2)',
              margin: 'var(--space-8) 0'
            }} />
          )}

          {/* Default Lists Section */}
          {defaultLists.length > 0 && (
            <>
              <div className="card-grid">
                {defaultLists.map((list) => {
              const totalWords = list.words.length
              const learnedWords = list.learnedWords.length
              const percentage = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0

              return (
                <Card
                  key={list.id}
                  variant="elevated"
                  padding="md"
                  hoverable
                  onClick={() => handleListClick(list)}
                  className="animate-fade-in-up"
                >
                  <div className="flex-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold" style={{ margin: 0 }}>
                          {list.name}
                        </h3>
                        {list.isDefault && <Badge variant="info" size="sm">Default</Badge>}
                      </div>
                      <div className="text-xs text-secondary mb-2">
                        {learnedWords} / {totalWords} words learned
                      </div>
                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--color-gray-200)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--color-success-500), var(--color-success-600))',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div className="text-xs text-secondary mt-1">
                        {percentage}% complete
                      </div>
                    </div>
                    {!list.isDefault && (
                      <div onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'var(--space-3)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteList(list.id)}
                          title="Delete list"
                        >
                          🗑️
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
        </div>
      </>
    )}
  </>
)}

      {selectedListModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedListModal(null)
            setIsRenamingModal(false)
            setModalListName('')
            setShowAddWordsMode(false)
            setSearchQuery('')
            setSearchResults([])
          }}
          size="lg"
          title={
            !isRenamingModal ? (
              <div
                onClick={() => {
                  const isDefault = selectedListModal.isDefault || selectedListModal.id === 'unstudied' || selectedListModal.id === 'learned'
                  if (!isDefault) {
                    handleStartRenameModal()
                  }
                }}
                style={{
                  cursor: selectedListModal.isDefault || selectedListModal.id === 'unstudied' || selectedListModal.id === 'learned' ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title={selectedListModal.isDefault || selectedListModal.id === 'unstudied' || selectedListModal.id === 'learned' ? '' : 'Click to rename'}
              >
                {selectedListModal.name}
                {!(selectedListModal.isDefault || selectedListModal.id === 'unstudied' || selectedListModal.id === 'learned') && (
                  <span style={{ fontSize: '0.8em', opacity: 0.5 }}>✏️</span>
                )}
              </div>
            ) : undefined
          }
          showCloseButton={true}
        >
          {isRenamingModal && (
            <div className="mb-4">
              <Input
                type="text"
                value={modalListName}
                onChange={(e) => setModalListName(e.target.value)}
                autoFocus
                fullWidth
                placeholder="List name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveRenameModal()
                  } else if (e.key === 'Escape') {
                    handleCancelRenameModal()
                  }
                }}
              />
              <div className="flex gap-3 justify-end mt-3">
                <Button variant="secondary" onClick={handleCancelRenameModal}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveRenameModal}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {selectedListModal.isReadOnly && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-info-100)', border: '1px solid var(--color-info-300)' }}>
              <div className="text-sm" style={{ color: 'var(--color-info-800)' }}>
                ℹ️ This is a read-only list. You can practice these words and mark them as learned, but you cannot remove words from this list.
              </div>
            </div>
          )}

          {/* Add Words Button for custom lists */}
          {!selectedListModal.isReadOnly && !isRenamingModal && (
            <div className="mb-4">
              <Button
                variant={showAddWordsMode ? "secondary" : "primary"}
                size="md"
                onClick={handleToggleAddWordsMode}
                fullWidth
              >
                {showAddWordsMode ? 'View List' : '+ Add Words'}
              </Button>
            </div>
          )}

          {/* Add Words Mode - Search and Results */}
          {showAddWordsMode && !isRenamingModal && (
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search words in Greek or English..."
                value={searchQuery}
                onChange={(e) => handleSearchWords(e.target.value)}
                autoFocus
                fullWidth
              />
              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2 mt-3" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                  {searchResults.map((word) => {
                    const isWordInList = selectedListModal.words.some(w => w.greek === word.greek)
                    return (
                      <div
                        key={word.greek}
                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{word.greek}</div>
                          {word.pos && <div className="text-xs text-tertiary italic">{word.pos}</div>}
                          <div className="text-sm text-secondary">{word.english}</div>
                        </div>
                        {isWordInList ? (
                          <Badge variant="success" size="sm">Added</Badge>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddWordToList(word)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-4 text-secondary">
                  No words found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* Word List Display - hidden when in Add Words mode */}
          {!showAddWordsMode && (
            <div>
              {selectedListModal.words.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  This list is empty. {!selectedListModal.isReadOnly && 'Click "+ Add Words" to add words to this list!'}
                </div>
              ) : (
                <div className="flex flex-col gap-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {selectedListModal.words.map((word, index) => {
                  const isLearned = selectedListModal.learnedWords.includes(word.greek)
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border transition ${
                        isLearned ? 'bg-gray-50 opacity-75' : 'bg-white'
                      }`}
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{word.greek}</div>
                        {word.pos && <div className="text-sm text-tertiary italic">{word.pos}</div>}
                        <div className="text-sm text-secondary">{word.english}</div>
                        {isLearned && <Badge variant="success" size="sm" className="mt-1">✓ Learned</Badge>}
                      </div>
                      {!selectedListModal.isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWord(selectedListModal.id, word.greek)}
                          title="Remove from list"
                          style={{ color: 'var(--color-danger-500)', fontSize: 'var(--text-2xl)' }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default WordLists
