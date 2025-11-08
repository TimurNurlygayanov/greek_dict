import { useState, useEffect, useCallback } from 'react'
import { getUserLists } from '../utils/wordLists'

/**
 * Custom hook to manage word lists with caching and loading states
 * Consolidates duplicate list fetching logic from multiple components
 *
 * @param {boolean} autoLoad - Whether to load lists automatically on mount
 * @returns {object} - Lists data, loading state, and helper functions
 */
const useWordLists = (autoLoad = true) => {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadLists = useCallback(async (useCache = true) => {
    setLoading(true)
    setError(null)

    try {
      const userLists = await getUserLists(useCache)

      // Sort: custom lists first, then default lists
      const customLists = userLists.filter(list => !list.isDefault).sort((a, b) => a.name.localeCompare(b.name))
      const defaultLists = userLists.filter(list => list.isDefault).sort((a, b) => a.name.localeCompare(b.name))

      setLists([...customLists, ...defaultLists])
    } catch (err) {
      console.error('Error loading lists:', err)
      setError(err.message || 'Failed to load word lists')
      setLists([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh lists (force fresh fetch)
  const refreshLists = useCallback(() => {
    return loadLists(false)
  }, [loadLists])

  // Find a specific list by ID
  const getListById = useCallback((listId) => {
    return lists.find(list => list.id === listId)
  }, [lists])

  // Get lists by type
  const getCustomLists = useCallback(() => {
    return lists.filter(list => !list.isDefault)
  }, [lists])

  const getDefaultLists = useCallback(() => {
    return lists.filter(list => list.isDefault)
  }, [lists])

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadLists()
    }
  }, [autoLoad, loadLists])

  return {
    lists,
    loading,
    error,
    loadLists,
    refreshLists,
    getListById,
    getCustomLists,
    getDefaultLists,
    hasLists: lists.length > 0
  }
}

export default useWordLists
