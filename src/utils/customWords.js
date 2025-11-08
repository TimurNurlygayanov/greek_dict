import { getUserId } from './storage'

const API_BASE = ''

/**
 * Get all custom words for the current user
 */
export const getCustomWords = async () => {
  const userId = await getUserId()
  if (!userId) return []

  try {
    const response = await fetch(`${API_BASE}/api/custom-words/${userId}`)
    if (!response.ok) throw new Error('Failed to fetch custom words')

    const data = await response.json()
    return data.words || []
  } catch (error) {
    console.error('Error fetching custom words:', error)
    return []
  }
}

/**
 * Add a new custom word
 */
export const addCustomWord = async (greek, english, pos = '') => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_BASE}/api/custom-words/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ greek, english, pos })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add custom word')
  }

  const data = await response.json()
  return data.word
}

/**
 * Delete a custom word
 */
export const deleteCustomWord = async (greekWord) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_BASE}/api/custom-words/${userId}/${encodeURIComponent(greekWord)}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete custom word')
  }

  return true
}

/**
 * Translate text using the translation API
 * @param {string} text - Text to translate
 * @param {string} from - Source language (default: 'en' for English)
 * @param {string} to - Target language (default: 'el' for Greek)
 */
export const translateText = async (text, from = 'en', to = 'el') => {
  try {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to })
    })

    if (!response.ok) throw new Error('Translation failed')

    const data = await response.json()
    return {
      translation: data.translation || '',
      error: data.error || null
    }
  } catch (error) {
    console.error('Translation error:', error)
    return {
      translation: '',
      error: 'Translation failed. Please enter translation manually.'
    }
  }
}
