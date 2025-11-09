import { useState } from 'react'
import { createList, addWordToList } from '../utils/wordLists'
import Modal from './common/Modal'
import Card from './common/Card'
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
      title={
        <div style={{ textAlign: 'center' }}>
          <div className="text-2xl font-bold text-primary" style={{ marginBottom: '8px' }}>{word.greek}</div>
          <div className="text-base text-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>{word.english}</div>
        </div>
      }
      size="md"
    >

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
        <div className="mb-3">
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
          <div className="flex flex-col gap-3 mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {lists.map((list) => {
              const isWordInList = list.words.some(w => w.greek === word.greek)
              const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
              // Check if this is a default level list that matches the word's level (e.g., "A1 Words" for an A1 word)
              const isDefaultLevelList = isDefault && word.level && list.name.includes(word.level)

              return (
                <Card
                  key={list.id}
                  variant="elevated"
                  padding="md"
                  hoverable={!isWordInList}
                  onClick={() => !isWordInList && !loading && handleAddToList(list.id)}
                  style={{
                    cursor: isWordInList || loading ? 'default' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-semibold" style={{ margin: 0 }}>
                          {list.name}
                        </span>
                        {isDefault && <Badge variant="info" size="sm">Default</Badge>}
                        {isWordInList && <Badge variant="success" size="sm">Added</Badge>}
                      </div>
                      <div className="text-sm text-secondary">{list.words.length} words</div>
                    </div>
                    {isWordInList ? (
                      <span className="text-success-600 text-2xl" style={{ marginLeft: '12px' }}>✓</span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToList(list.id)
                        }}
                        disabled={loading}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => setShowCreateForm(true)}
            fullWidth
            icon={<span>+</span>}
          >
            Create New List
          </Button>
        </>
      )}
    </Modal>
  )
}

export default AddToListModal

