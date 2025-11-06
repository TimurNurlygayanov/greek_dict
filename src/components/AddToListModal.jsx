import { useState, useEffect } from 'react'
import { getUserLists, createList, addWordToList } from '../utils/wordLists'
import './AddToListModal.css'

const AddToListModal = ({ word, onClose, onSuccess }) => {
  const [lists, setLists] = useState([])
  const [newListName, setNewListName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    const userLists = await getUserLists()
    setLists(userLists)
  }

  const handleAddToList = async (listId) => {
    setLoading(true)
    try {
      await addWordToList(listId, word)
      // Reload lists to get updated data
      await loadLists()
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      alert(error.message || 'Failed to add word to list')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setLoading(true)
    try {
      const newList = await createList(newListName.trim())
      setLists([...lists, newList])
      setNewListName('')
      setShowCreateForm(false)
      await handleAddToList(newList.id)
    } catch (error) {
      alert(error.message || 'Failed to create list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-to-list-modal-overlay" onClick={onClose}>
      <div className="add-to-list-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Add to List</h2>
        <p className="modal-word">{word.greek}</p>

        {lists.length === 0 && !showCreateForm && (
          <div className="no-lists">
            <p>You don't have any lists yet.</p>
            <button 
              className="create-list-button"
              onClick={() => setShowCreateForm(true)}
            >
              Create New List
            </button>
          </div>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateList} className="create-list-form">
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
              <button type="submit" className="submit-button" disabled={loading || !newListName.trim()}>
                Create & Add
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
        )}

        {lists.length > 0 && !showCreateForm && (
          <>
            <div className="lists-container">
              {lists.map((list) => {
                const isWordInList = list.words.some(w => w.greek === word.greek)
                const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
                return (
                  <div 
                    key={list.id} 
                    className={`list-item ${isDefault ? 'default-list-item' : ''} ${isWordInList ? 'added' : ''}`}
                    onClick={() => !isWordInList && handleAddToList(list.id)}
                  >
                    <div className="list-info">
                      <div className="list-name">
                        {list.name}
                        {isDefault && <span className="default-badge-inline">Default</span>}
                      </div>
                      <div className="list-count">{list.words.length} words</div>
                    </div>
                    {isWordInList && <span className="added-check">✓</span>}
                  </div>
                )
              })}
              <div 
                className="list-item create-item"
                onClick={() => setShowCreateForm(true)}
              >
                <div className="list-info">
                  <div className="list-name">+ Create New List</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AddToListModal

