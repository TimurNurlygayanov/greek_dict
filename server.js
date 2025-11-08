// Full ESM version of server.js
import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 10000
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json')
const LISTS_FILE = path.join(DATA_DIR, 'word-lists.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
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
app.use(express.static(path.join(process.cwd(), 'dist')))

// Helper functions for reading/writing progress
const readProgress = () => {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return {}
  }
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading progress file:', error)
    return {}
  }
}

const writeProgress = (data) => {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing progress file:', error)
    throw error
  }
}

// Helper functions for reading/writing word lists
const readWordLists = () => {
  if (!fs.existsSync(LISTS_FILE)) {
    return {}
  }
  try {
    const data = fs.readFileSync(LISTS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading word lists file:', error)
    return {}
  }
}

const writeWordLists = (data) => {
  try {
    fs.writeFileSync(LISTS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing word lists file:', error)
    throw error
  }
}

// Load dictionary at server start
let dictionary = []
try {
  const dictPath = path.join(process.cwd(), 'src/dictionary.json')
  dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'))
  console.log('Dictionary loaded successfully')
} catch (error) {
  console.error('Error loading dictionary:', error)
}

// Helper function to ensure default lists
const ensureDefaultLists = (userId, userLists) => {
  let updated = false

  // Create level-based lists (A1, A2, B1, B2)
  const levels = ['A1', 'A2', 'B1', 'B2']
  levels.forEach(level => {
    let levelList = userLists.find(list => list.id === level.toLowerCase())
    if (!levelList) {
      const levelWords = dictionary.filter(word => word.level === level)
      levelList = {
        id: level.toLowerCase(),
        name: `${level} Words`,
        words: levelWords.map(word => ({ ...word })),
        learnedWords: [],
        isDefault: true,
        isReadOnly: true // Can't remove words from level lists
      }
      userLists.push(levelList)
      updated = true
    } else if (levelList.words.length === 0) {
      // Repopulate if empty
      const levelWords = dictionary.filter(word => word.level === level)
      levelList.words = levelWords.map(word => ({ ...word }))
      levelList.isReadOnly = true
      updated = true
    }
  })

  return updated
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

// API Routes for word lists
app.get('/api/lists/:userId', (req, res) => {
  const { userId } = req.params
  let allData = readWordLists()
  if (!allData[userId]) allData[userId] = []
  
  const updated = ensureDefaultLists(userId, allData[userId])
  if (updated) {
    writeWordLists(allData)
  }
  
  res.json({ lists: allData[userId] })
})

app.post('/api/lists/:userId', (req, res) => {
  const { userId } = req.params
  const { name } = req.body
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'List name is required' })
  }
  
  let allData = readWordLists()
  if (!allData[userId]) allData[userId] = []
  
  ensureDefaultLists(userId, allData[userId])
  
  // Count only non-default lists
  const customLists = allData[userId].filter(l => !l.isDefault)
  
  // Check limit (50 custom lists per user, excluding default ones)
  if (customLists.length >= 50) {
    return res.status(400).json({ error: 'Maximum 50 custom lists per user' })
  }
  
  // Check if list with same name exists
  if (allData[userId].some(list => list.name === name.trim())) {
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
  
  allData[userId].push(newList)
  writeWordLists(allData)
  
  res.json({ list: newList })
})

app.put('/api/lists/:userId/:listId', (req, res) => {
  const { userId, listId } = req.params
  const { name } = req.body
  const allData = readWordLists()
  
  if (!allData[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = allData[userId].find(l => l.id === listId)
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
  if (allData[userId].some(l => l.id !== listId && l.name === name.trim())) {
    return res.status(400).json({ error: 'List with this name already exists' })
  }
  
  list.name = name.trim()
  writeWordLists(allData)
  
  res.json({ list })
})

app.delete('/api/lists/:userId/:listId', (req, res) => {
  const { userId, listId } = req.params
  const allData = readWordLists()
  
  if (!allData[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  // Prevent deletion of default lists
  const list = allData[userId].find(l => l.id === listId)
  if (list && list.isDefault) {
    return res.status(400).json({ error: 'Cannot delete default list' })
  }
  
  allData[userId] = allData[userId].filter(list => list.id !== listId)
  writeWordLists(allData)
  
  res.json({ success: true })
})

app.post('/api/lists/:userId/:listId/words', (req, res) => {
  const { userId, listId } = req.params
  const { word } = req.body
  
  if (!word || !word.greek) {
    return res.status(400).json({ error: 'Word is required' })
  }
  
  const allData = readWordLists()
  if (!allData[userId]) allData[userId] = []
  
  ensureDefaultLists(userId, allData[userId])
  
  const list = allData[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  // Check if word already in list
  if (!list.words.some(w => w.greek === word.greek)) {
    list.words.push(word)
  }

  writeWordLists(allData)
  
  res.json({ list })
})

app.delete('/api/lists/:userId/:listId/words/:wordGreek', (req, res) => {
  const { userId, listId, wordGreek } = req.params
  const allData = readWordLists()

  if (!allData[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }

  const list = allData[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }

  // Prevent removing words from read-only lists (level lists)
  if (list.isReadOnly) {
    return res.status(400).json({ error: 'Cannot remove words from this list. You can practice and mark words as learned.' })
  }

  list.words = list.words.filter(w => w.greek !== decodeURIComponent(wordGreek))
  writeWordLists(allData)

  res.json({ list })
})

app.post('/api/lists/:userId/:listId/learned', (req, res) => {
  const { userId, listId } = req.params
  const { wordGreek } = req.body
  
  if (!wordGreek) {
    return res.status(400).json({ error: 'Word is required' })
  }
  
  const allData = readWordLists()
  if (!allData[userId]) allData[userId] = []
  
  ensureDefaultLists(userId, allData[userId])
  
  const list = allData[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  if (!list.learnedWords.includes(wordGreek)) {
    list.learnedWords.push(wordGreek)
  }

  writeWordLists(allData)
  
  res.json({ list })
})

app.delete('/api/lists/:userId/:listId/learned/:wordGreek', (req, res) => {
  const { userId, listId, wordGreek } = req.params
  const allData = readWordLists()
  
  if (!allData[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const list = allData[userId].find(l => l.id === listId)
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  
  list.learnedWords = list.learnedWords.filter(w => w !== decodeURIComponent(wordGreek))
  writeWordLists(allData)
  
  res.json({ list })
})

// Handle React Router - serve index.html for all routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Progress data will be stored in ${DATA_DIR}`)
})