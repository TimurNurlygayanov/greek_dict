import { useState } from 'react'
import { createList, addWordToList } from '../utils/wordLists'
import Modal from './common/Modal'
import Button from './common/Button'
import Input from './common/Input'
import Badge from './common/Badge'
import useWordLists from '../hooks/useWordLists'

const AddToListModal = ({ word, onClose, onSuccess }) => {
  const { lists, refreshLists } = useWordLists()
  const [newListName, setNewListName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddToList = async (listId) => {
    setLoading(true)
    try {
      await addWordToList(listId, word)
      await refreshLists()
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
      await refreshLists()
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={null}
      size="md"
    >
      {/* Word Header */}
      <div className="mb-6 pb-4 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-sm text-secondary mb-1">Adding word to list:</div>
        <div className="text-3xl font-bold text-primary">{word.greek}</div>
        <div className="text-sm text-secondary mt-1">{word.english}</div>
      </div>

      {lists.length === 0 && !showCreateForm && (
        <div className="text-center py-6">
          <p className="text-secondary mb-4">You don't have any lists yet.</p>
          <p className="text-secondary mb-4">Create your first list to start organizing words!</p>
          <Button variant="primary" size="lg" onClick={() => setShowCreateForm(true)}>
            Create Your First List
          </Button>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold mb-1" style={{ margin: 0 }}>Create New List</h3>
            <p className="text-xs text-secondary">Enter a name for your new word list</p>
          </div>
          <form onSubmit={handleCreateList} className="flex flex-col gap-3">
            <Input
              type="text"
              placeholder="e.g., Vocabulary for Travel, Common Verbs..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              maxLength={50}
              fullWidth
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !newListName.trim()}
                loading={loading}
                fullWidth
              >
                Create & Add Word
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
        </div>
      )}

      {lists.length > 0 && !showCreateForm && (
        <>
          <div className="mb-3">
            <h3 className="text-lg font-semibold mb-1" style={{ margin: 0 }}>Your Lists</h3>
            <p className="text-xs text-secondary">Click a list to add this word</p>
          </div>
          <div className="flex flex-col gap-2 mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {lists.map((list) => {
              const isWordInList = list.words.some(w => w.greek === word.greek)
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
              return (
                <div
                  key={list.id}
                  onClick={() => !isWordInList && !loading && handleAddToList(list.id)}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 transition
                    ${isWordInList
                      ? 'bg-success-50 border-success-300 cursor-default'
                      : 'border-gray-200 hover:border-primary hover:bg-primary-50 cursor-pointer'}
                  `}
                  style={{ cursor: isWordInList || loading ? 'default' : 'pointer' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${isWordInList ? 'text-success-700' : ''}`}>
                        {list.name}
                      </span>
                      {isDefault && <Badge variant="info" size="sm">Default</Badge>}
                    </div>
                    <div className="text-xs text-secondary">{list.words.length} words</div>
                  </div>
                  {isWordInList ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm">Already added</Badge>
                      <span className="text-success-600 text-xl">✓</span>
                    </div>
                  ) : (
                    <span className="text-primary text-sm font-medium">+ Add</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowCreateForm(true)}
              fullWidth
              icon={<span>+</span>}
            >
              Create New List
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

export default AddToListModal

