// Utility functions for managing user progress
// Currently uses localStorage, but can be extended for Google auth

const STORAGE_KEYS = {
  EXERCISES_TODAY: 'ellinaki_exercises_today',
  EXERCISES_DATE: 'ellinaki_exercises_date',
  MEMORIZED_WORDS: 'ellinaki_memorized_words',
  USER_ID: 'ellinaki_user_id'
}

export const getTodayExercises = () => {
  const today = new Date().toDateString()
  const storedDate = localStorage.getItem(STORAGE_KEYS.EXERCISES_DATE)
  
  if (storedDate !== today) {
    // Reset if it's a new day
    localStorage.setItem(STORAGE_KEYS.EXERCISES_TODAY, '0')
    localStorage.setItem(STORAGE_KEYS.EXERCISES_DATE, today)
    return 0
  }
  
  return parseInt(localStorage.getItem(STORAGE_KEYS.EXERCISES_TODAY) || '0', 10)
}

export const incrementTodayExercises = () => {
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

export const getMemorizedWords = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.MEMORIZED_WORDS)
  return stored ? JSON.parse(stored) : []
}

export const addMemorizedWord = (greekWord) => {
  const memorized = getMemorizedWords()
  if (!memorized.includes(greekWord)) {
    memorized.push(greekWord)
    localStorage.setItem(STORAGE_KEYS.MEMORIZED_WORDS, JSON.stringify(memorized))
  }
}

export const isWordMemorized = (greekWord) => {
  const memorized = getMemorizedWords()
  return memorized.includes(greekWord)
}

// Placeholder for future Google auth integration
export const getUserId = () => {
  return localStorage.getItem(STORAGE_KEYS.USER_ID) || null
}

export const setUserId = (userId) => {
  localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
}

