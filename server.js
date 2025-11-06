import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 10000
const DATA_DIR = '/data'
const PROGRESS_FILE = join(DATA_DIR, 'progress.json')
const LISTS_FILE = join(DATA_DIR, 'word-lists.json')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  try {
    mkdirSync(DATA_DIR, { recursive: true })
    console.log(`Created data directory: ${DATA_DIR}`)
  } catch (error) {
    console.error(`Failed to create data directory ${DATA_DIR}:`, error)
    console.warn('Progress will not be persisted. Check disk mount configuration.')
  }
} else {
  console.log(`Using existing data directory: ${DATA_DIR}`)
}

// Middleware
app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))

// Helper functions for reading/writing progress
const readProgress = () => {
  if (!existsSync(PROGRESS_FILE)) {
    return {}
  }
  try {
    const data = readFileSync(PROGRESS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading progress file:', error)
    return {}
  }
}

const writeProgress = (data) => {
  try {
    writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing progress file:', error)
    throw error
  }
}

// Helper functions for reading/writing word lists
const readWordLists = () => {
  if (!existsSync(LISTS_FILE)) {
    return {}
  }
  try {
    const data = readFileSync(LISTS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading word lists file:', error)
    return {}
  }
}

const writeWordLists = (data) => {
  try {
    writeFileSync(LISTS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing word lists file:', error)
    throw error
  }
}

// API Routes for progress
app.get('/api/progress/:userId', (req, res) => {
  const { userId } = req.params
  const progress = readProgress()
  const userProgress = progress[userId] || {
    exercisesToday: 0,
    exercisesDate: new Date().toDateString(),
    memorizedWords: []
  }
  
  // Reset if new day
  const today = new Date().toDateString()
  if (userProgress.exercisesDate !== today) {
    userProgress.exercisesToday = 0
    userProgress.exercisesDate = today
  }
  
  res.json(userProgress)
})

app.post('/api/progress/:userId/exercises', (req, res) => {
  const { userId } = req.params
  const progress = readProgress()
  const today = new Date().toDateString()
  
  if (!progress[userId]) {
    progress[userId] = {
      exercisesToday: 0,
      exercisesDate: today,
      memorizedWords: []
    }
  }
  
  const userProgress = progress[userId]
  
  // Reset if new day
  if (userProgress.exercisesDate !== today) {
    userProgress.exercisesToday = 0
    userProgress.exercisesDate = today
  }
  
  userProgress.exercisesToday += 1
  writeProgress(progress)
  
  res.json({ exercisesToday: userProgress.exercisesToday })
})

app.post('/api/progress/:userId/memorized', (req, res) => {
  const { userId } = req.params
  const { word } = req.body
  
  if (!word) {
    return res.status(400).json({ error: 'Word is required' })
  }
  
  const progress = readProgress()
  
  if (!progress[userId]) {
    progress[userId] = {
      exercisesToday: 0,
      exercisesDate: new Date().toDateString(),
      memorizedWords: []
    }
  }
  
  const userProgress = progress[userId]
  
  if (!userProgress.memorizedWords.includes(word)) {
    userProgress.memorizedWords.push(word)
    writeProgress(progress)
  }
  
  res.json({ memorizedWords: userProgress.memorizedWords })
})

app.get('/api/progress/:userId/memorized', (req, res) => {
  const { userId } = req.params
  const progress = readProgress()
  const userProgress = progress[userId] || { memorizedWords: [] }
  
  res.json({ memorizedWords: userProgress.memorizedWords })
})

// Helper function to ensure default lists exist
const ensureDefaultLists = (userId, lists) => {
  if (!lists[userId]) {
    lists[userId] = []
  }
  
  const userLists = lists[userId]
  const now = new Date().toISOString()
  
  // Check if "Unstudied Words" list exists
  let unstudiedList = userLists.find(l => l.id === 'unstudied')
  if (!unstudiedList) {
    unstudiedList = {
      id: 'unstudied',
      name: 'Unstudied Words',
      words: [],
      learnedWords: [],
      createdAt: now,
      isDefault: true
    }
    userLists.push(unstudiedList)
  }
  
  // Check if "Learned Words" list exists
  let learnedList = userLists.find(l => l.id === 'learned')
  if (!learnedList) {
    learnedList = {
      id: 'learned',
      name: 'Learned Words',
      words: [],
      learnedWords: [],
      createdAt: now,
      isDefault: true
    }
    userLists.push(learnedList)
  }
  
  return { unstudiedList, learnedList }
}

// API Routes for word lists
app.get('/api/lists/:userId', (req, res) => {
  const { userId } = req.params
  const lists = readWordLists()
  ensureDefaultLists(userId, lists)
  writeWordLists(lists) // Save if default lists were created
  const userLists = lists[userId] || []
  res.json({ lists: userLists })
})

app.post('/api/lists/:userId', (req, res) => {
  const { userId } = req.params
  const { name } = req.body
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'List name is required' })
  }
  
  const lists = readWordLists()
  ensureDefaultLists(userId, lists)
  
  // Count only non-default lists
  const customLists = lists[userId].filter(l => !l.isDefault)
  
  // Check limit (50 custom lists per user, excluding default ones)
  if (customLists.length >= 50) {
    return res.status(400).json({ error: 'Maximum 50 custom lists per user' })
  }
  
  // Check if list with same name exists
  if (lists[userId].some(list => list.name === name.trim())) {
    return res.status(400).json({ error: 'List with this name already exists' })
  }
  
  const newList = {
    id: Date.now().toString(),
    name: name.trim(),
    words: [],
    learnedWords: [],
    createdAt: new Date().toISOString(),
    isDefault: false
  }
  
  lists[userId].push(newList)
  writeWordLists(lists)
  
  res.json({ list: newList })
})

app.put('/api/lists/:userId/:listId', (req, res) => {
  const { userId, listId } = req.params
  const { name } = req.body
  const lists = readWordLists()
  
  if (!lists[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = lists[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  // Prevent renaming default lists
  if (list.isDefault || listId === 'unstudied' || listId === 'learned') {
    return res.status(400).json({ error: 'Cannot rename default list' })
  }
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'List name is required' })
  }
  
  // Check if list with same name exists (excluding current list)
  if (lists[userId].some(l => l.id !== listId && l.name === name.trim())) {
    return res.status(400).json({ error: 'List with this name already exists' })
  }
  
  list.name = name.trim()
  writeWordLists(lists)
  
  res.json({ list })
})

app.delete('/api/lists/:userId/:listId', (req, res) => {
  const { userId, listId } = req.params
  const lists = readWordLists()
  
  if (!lists[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  // Prevent deletion of default lists
  const list = lists[userId].find(l => l.id === listId)
  if (list && list.isDefault) {
    return res.status(400).json({ error: 'Cannot delete default list' })
  }
  
  lists[userId] = lists[userId].filter(list => list.id !== listId)
  writeWordLists(lists)
  
  res.json({ success: true })
})

app.post('/api/lists/:userId/:listId/words', (req, res) => {
  const { userId, listId } = req.params
  const { word } = req.body
  
  if (!word || !word.greek) {
    return res.status(400).json({ error: 'Word is required' })
  }
  
  const lists = readWordLists()
  ensureDefaultLists(userId, lists)
  
  if (!lists[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = lists[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  // Allow duplicate words (word can be in multiple lists)
  // Check if word already in list
  if (!list.words.some(w => w.greek === word.greek)) {
    list.words.push(word)
  }
  
  // Handle "Unstudied Words" logic
  if (listId === 'unstudied') {
    // When adding to "Unstudied Words", check if word is in any custom list
    const customLists = lists[userId].filter(l => l.id !== 'unstudied' && l.id !== 'learned')
    const wordInCustomLists = customLists.some(l => l.words.some(w => w.greek === word.greek))
    
    // Only add to unstudied if word is NOT in any custom list
    // (if it's in custom lists, it's already being studied, so not "unstudied")
    if (wordInCustomLists) {
      // Remove from unstudied if it was there (word is now in custom lists)
      list.words = list.words.filter(w => w.greek !== word.greek)
    }
    // If not in custom lists, keep it in unstudied (already added above)
  } else if (listId !== 'learned') {
    // If word is added to a custom list, remove it from "Unstudied Words"
    // (because it's now in a custom list, so it's no longer "unstudied")
    const unstudiedList = lists[userId].find(l => l.id === 'unstudied')
    if (unstudiedList) {
      unstudiedList.words = unstudiedList.words.filter(w => w.greek !== word.greek)
    }
  }
  
  writeWordLists(lists)
  
  res.json({ list })
})

app.delete('/api/lists/:userId/:listId/words/:wordGreek', (req, res) => {
  const { userId, listId, wordGreek } = req.params
  const lists = readWordLists()
  
  if (!lists[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = lists[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  list.words = list.words.filter(w => w.greek !== decodeURIComponent(wordGreek))
  writeWordLists(lists)
  
  res.json({ list })
})

app.post('/api/lists/:userId/:listId/learned', (req, res) => {
  const { userId, listId } = req.params
  const { wordGreek } = req.body
  
  if (!wordGreek) {
    return res.status(400).json({ error: 'Word is required' })
  }
  
  const lists = readWordLists()
  ensureDefaultLists(userId, lists)
  
  if (!lists[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = lists[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  // Mark word as learned in this list
  if (!list.learnedWords.includes(wordGreek)) {
    list.learnedWords.push(wordGreek)
  }
  
  // Also add to "Learned Words" default list
  const learnedList = lists[userId].find(l => l.id === 'learned')
  if (learnedList) {
    // Find the word object to add
    const wordObj = list.words.find(w => w.greek === wordGreek)
    if (wordObj && !learnedList.words.some(w => w.greek === wordGreek)) {
      learnedList.words.push(wordObj)
    }
    if (!learnedList.learnedWords.includes(wordGreek)) {
      learnedList.learnedWords.push(wordGreek)
    }
  }
  
  // Remove from "Unstudied Words" if it was there
  const unstudiedList = lists[userId].find(l => l.id === 'unstudied')
  if (unstudiedList) {
    unstudiedList.words = unstudiedList.words.filter(w => w.greek !== wordGreek)
    if (unstudiedList.learnedWords.includes(wordGreek)) {
      unstudiedList.learnedWords = unstudiedList.learnedWords.filter(w => w !== wordGreek)
    }
  }
  
  writeWordLists(lists)
  
  res.json({ list })
})

app.delete('/api/lists/:userId/:listId/learned/:wordGreek', (req, res) => {
  const { userId, listId, wordGreek } = req.params
  const lists = readWordLists()
  
  if (!lists[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = lists[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  list.learnedWords = list.learnedWords.filter(w => w !== decodeURIComponent(wordGreek))
  writeWordLists(lists)
  
  res.json({ list })
})

// Handle React Router - serve index.html for all routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Progress data will be stored in ${DATA_DIR}`)
})

