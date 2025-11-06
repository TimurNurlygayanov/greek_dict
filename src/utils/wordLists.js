// Utility functions for managing word lists
import { getUserId } from './storage'

const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`API request failed: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request error:', error, 'Endpoint:', endpoint)
    throw error
  }
}

export const getUserLists = async () => {
  const userId = getUserId()
  if (!userId) {
    console.log('getUserLists: No userId')
    return []
  }
  
  try {
    console.log('getUserLists: Fetching lists for userId:', userId)
    const data = await apiRequest(`/api/lists/${userId}`)
    console.log('getUserLists: API response:', data)
    const lists = data?.lists || []
    console.log('getUserLists: Returning lists:', lists)
    return lists
  } catch (error) {
    console.error('Error fetching lists:', error)
    return []
  }
}

export const createList = async (name) => {
  const userId = getUserId()
  if (!userId) return null
  
  try {
    const data = await apiRequest(`/api/lists/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ name })
    })
    return data?.list || null
  } catch (error) {
    console.error('Error creating list:', error)
    throw error
  }
}

export const deleteList = async (listId) => {
  const userId = getUserId()
  if (!userId) return false
  
  try {
    await apiRequest(`/api/lists/${userId}/${listId}`, {
      method: 'DELETE'
    })
    return true
  } catch (error) {
    console.error('Error deleting list:', error)
    return false
  }
}

export const addWordToList = async (listId, word) => {
  const userId = getUserId()
  if (!userId) return null
  
  try {
    const data = await apiRequest(`/api/lists/${userId}/${listId}/words`, {
      method: 'POST',
      body: JSON.stringify({ word })
    })
    return data?.list || null
  } catch (error) {
    console.error('Error adding word to list:', error)
    throw error
  }
}

export const removeWordFromList = async (listId, wordGreek) => {
  const userId = getUserId()
  if (!userId) return null
  
  try {
    const data = await apiRequest(`/api/lists/${userId}/${listId}/words/${encodeURIComponent(wordGreek)}`, {
      method: 'DELETE'
    })
    return data?.list || null
  } catch (error) {
    console.error('Error removing word from list:', error)
    return null
  }
}

export const markWordAsLearned = async (listId, wordGreek) => {
  const userId = getUserId()
  if (!userId) return null
  
  try {
    const data = await apiRequest(`/api/lists/${userId}/${listId}/learned`, {
      method: 'POST',
      body: JSON.stringify({ wordGreek })
    })
    return data?.list || null
  } catch (error) {
    console.error('Error marking word as learned:', error)
    return null
  }
}

export const unmarkWordAsLearned = async (listId, wordGreek) => {
  const userId = getUserId()
  if (!userId) return null
  
  try {
    const data = await apiRequest(`/api/lists/${userId}/${listId}/learned/${encodeURIComponent(wordGreek)}`, {
      method: 'DELETE'
    })
    return data?.list || null
  } catch (error) {
    console.error('Error unmarking word as learned:', error)
    return null
  }
}

export const updateListName = async (listId, newName) => {
  const userId = getUserId()
  if (!userId) return null
  
  try {
    const data = await apiRequest(`/api/lists/${userId}/${listId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName })
    })
    return data?.list || null
  } catch (error) {
    console.error('Error updating list name:', error)
    throw error
  }
}

