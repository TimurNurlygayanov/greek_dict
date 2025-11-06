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

// Handle React Router - serve index.html for all routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Progress data will be stored in ${DATA_DIR}`)
})

