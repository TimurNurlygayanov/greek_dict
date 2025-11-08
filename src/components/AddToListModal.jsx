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
      title="Add to List"
      size="md"
    >
      <div className="mb-4 text-center">
        <p className="text-2xl font-semibold text-primary">{word.greek}</p>
      </div>

      {lists.length === 0 && !showCreateForm && (
        <div className="text-center py-6">
          <p className="text-secondary mb-4">You don't have any lists yet.</p>
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            Create New List
          </Button>
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateList} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="List name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            autoFocus
            maxLength={50}
            fullWidth
          />
          <div className="flex gap-3 justify-end">
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
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !newListName.trim()}
              loading={loading}
            >
              Create & Add
            </Button>
          </div>
        </form>
      )}

      {lists.length > 0 && !showCreateForm && (
        <div className="flex flex-col gap-2">
          {lists.map((list) => {
            const isWordInList = list.words.some(w => w.greek === word.greek)
            const isDefault = list.isDefault || list.id === 'unstudied' || list.id === 'learned'
            return (
              <div
                key={list.id}
                onClick={() => !isWordInList && !loading && handleAddToList(list.id)}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 transition cursor-pointer
                  ${isWordInList ? 'bg-gray-50 border-success cursor-default' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}
                `}
                style={{ cursor: isWordInList || loading ? 'default' : 'pointer' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{list.name}</span>
                    {isDefault && <Badge variant="info" size="sm">Default</Badge>}
                  </div>
                  <div className="text-sm text-secondary">{list.words.length} words</div>
                </div>
                {isWordInList && <span className="text-success text-2xl">✓</span>}
              </div>
            )
          })}
          <div
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-gray-50 transition cursor-pointer"
          >
            <span className="font-medium text-primary">+ Create New List</span>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AddToListModal

