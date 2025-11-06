// Utility functions for managing user progress
// Uses server API for persistent storage on disk, falls back to localStorage

const STORAGE_KEYS = {
  EXERCISES_TODAY: 'ellinaki_exercises_today',
  EXERCISES_DATE: 'ellinaki_exercises_date',
  MEMORIZED_WORDS: 'ellinaki_memorized_words',
  USER_ID: 'ellinaki_user_id'
}

// Get or generate user ID
const getOrCreateUserId = () => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID)
  if (!userId) {
    // Generate a simple user ID (in production, this would come from Google auth)
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
  }
  return userId
}

// API helper functions
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
      throw new Error(`API request failed: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    // Fallback to localStorage if API fails
    return null
  }
}

// Get today's exercises count
export const getTodayExercises = async () => {
  const userId = getOrCreateUserId()
  
  try {
    const data = await apiRequest(`/api/progress/${userId}`)
    if (data) {
      return data.exercisesToday || 0
    }
  } catch (error) {
    console.error('Error fetching exercises:', error)
  }
  
  // Fallback to localStorage
  const today = new Date().toDateString()
  const storedDate = localStorage.getItem(STORAGE_KEYS.EXERCISES_DATE)
  
  if (storedDate !== today) {
    localStorage.setItem(STORAGE_KEYS.EXERCISES_TODAY, '0')
    localStorage.setItem(STORAGE_KEYS.EXERCISES_DATE, today)
    return 0
  }
  
  return parseInt(localStorage.getItem(STORAGE_KEYS.EXERCISES_TODAY) || '0', 10)
}

// Increment today's exercises
export const incrementTodayExercises = async () => {
  const userId = getOrCreateUserId()
  
  try {
    const data = await apiRequest(`/api/progress/${userId}/exercises`, {
      method: 'POST'
    })
    if (data) {
      return data.exercisesToday
    }
  } catch (error) {
    console.error('Error incrementing exercises:', error)
  }
  
  // Fallback to localStorage
  const today = new Date().toDateString()
  const storedDate = localStorage.getItem(STORAGE_KEYS.EXERCISES_DATE)
  
  if (storedDate !== today) {
    localStorage.setItem(STORAGE_KEYS.EXERCISES_TODAY, '1')
    localStorage.setItem(STORAGE_KEYS.EXERCISES_DATE, today)
    return 1
  }
  
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.EXERCISES_TODAY) || '0', 10)
  const newValue = current + 1
  localStorage.setItem(STORAGE_KEYS.EXERCISES_TODAY, newValue.toString())
  return newValue
}

// Get memorized words
export const getMemorizedWords = async () => {
  const userId = getOrCreateUserId()
  
  try {
    const data = await apiRequest(`/api/progress/${userId}/memorized`)
    if (data) {
      return data.memorizedWords || []
    }
  } catch (error) {
    console.error('Error fetching memorized words:', error)
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.MEMORIZED_WORDS)
  return stored ? JSON.parse(stored) : []
}

// Add memorized word
export const addMemorizedWord = async (greekWord) => {
  const userId = getOrCreateUserId()
  
  try {
    await apiRequest(`/api/progress/${userId}/memorized`, {
      method: 'POST',
      body: JSON.stringify({ word: greekWord })
    })
  } catch (error) {
    console.error('Error adding memorized word:', error)
  }
  
  // Fallback to localStorage
  const memorized = await getMemorizedWords()
  if (!memorized.includes(greekWord)) {
    memorized.push(greekWord)
    localStorage.setItem(STORAGE_KEYS.MEMORIZED_WORDS, JSON.stringify(memorized))
  }
}

export const isWordMemorized = async (greekWord) => {
  const memorized = await getMemorizedWords()
  return memorized.includes(greekWord)
}

// User ID management
export const getUserId = () => {
  return getOrCreateUserId()
}

export const setUserId = (userId) => {
  localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
}

