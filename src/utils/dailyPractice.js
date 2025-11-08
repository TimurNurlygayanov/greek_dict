import { getUserId } from './storage'

const API_BASE = ''

/**
 * Get daily practice data for the current user
 */
export const getDailyPractice = async () => {
  const userId = await getUserId()
  if (!userId) return { needsSetup: true }

  try {
    const response = await fetch(`${API_BASE}/api/daily-practice/${userId}`)
    if (!response.ok) throw new Error('Failed to fetch daily practice')

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching daily practice:', error)
    return { needsSetup: true }
  }
}

/**
 * Setup daily practice with user's level
 */
export const setupDailyPractice = async (level) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_BASE}/api/daily-practice/${userId}/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level })
  })

  if (!response.ok) {
    try {
      const error = await response.json()
      throw new Error(error.error || 'Failed to setup daily practice')
    } catch (e) {
      throw new Error('Failed to setup daily practice')
    }
  }

  const data = await response.json()
  return data
}

/**
 * Update user's level and regenerate words
 */
export const updateDailyPracticeLevel = async (level) => {
  const userId = await getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch(`${API_BASE}/api/daily-practice/${userId}/level`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level })
  })

  if (!response.ok) {
    try {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update level')
    } catch (e) {
      throw new Error('Failed to update level')
    }
  }

  const data = await response.json()
  return data
}
