import { useState } from 'react'
import { createList, deleteList, removeWordFromList, unmarkWordAsLearned, getUserLists, updateListName } from '../utils/wordLists'
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

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-20)' }}>
      {showAuthModal && <AuthModal onClose={closeAuthModal} />}

      <div className="flex-between mb-6">
        <h2 className="text-4xl font-bold" style={{ color: 'white', margin: 0 }}>Your Lists</h2>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowCreateForm(true)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-3xl)',
            padding: 0
          }}
        >
          +
        </Button>
      </div>

      {showCreateForm && (
        <Card variant="elevated" padding="md" className="mb-6 animate-scale-in">
          <form onSubmit={handleCreateList} className="flex gap-3">
            <Input
              type="text"
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              maxLength={50}
              fullWidth
            />
            <Button type="submit" variant="primary" disabled={!newListName.trim()}>
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
          </form>
        </Card>
      )}

      {lists.length === 0 ? (
        <Card variant="elevated" padding="lg" className="text-center">
          <p className="text-lg text-secondary mb-2">You don't have any word lists yet.</p>
          <p className="text-secondary">Create your first list to start organizing words!</p>
        </Card>
      ) : (
        <div className="card-grid">
          {lists
            .sort((a, b) => {
              const aIsDefault = a.isDefault || a.id === 'unstudied' || a.id === 'learned'
              const bIsDefault = b.isDefault || b.id === 'unstudied' || b.id === 'learned'
              if (aIsDefault && !bIsDefault) return 1
              if (!aIsDefault && bIsDefault) return -1
              return 0
            })
            .map((list) => {
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'

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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold" style={{ margin: 0 }}>
                          {list.name}
                        </h3>
                        {isDefault && <Badge variant="info" size="sm">Default</Badge>}
                      </div>
                      <div className="text-sm text-secondary">
                        {list.words.length} word{list.words.length !== 1 ? 's' : ''}
                        {list.learnedWords.length > 0 && (
                          <span style={{ color: 'var(--color-success-600)', fontWeight: 'var(--font-weight-semibold)' }}>
                            {' • '}{list.learnedWords.length} learned
                          </span>
                        )}
                      </div>
                    </div>
                    {!isDefault && (
                      <div onClick={(e) => e.stopPropagation()}>
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
      )}

      {selectedListModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedListModal(null)
            setIsRenamingModal(false)
            setModalListName('')
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

          <div>
            {selectedListModal.words.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                This list is empty. Add words from the Dictionary!
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
        </Modal>
      )}
    </div>
  )
}

export default WordLists
