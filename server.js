// Full ESM version of server.js
import express from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import xlsx from 'xlsx'

const app = express()
const PORT = process.env.PORT || 10000
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json')
const LISTS_FILE = path.join(DATA_DIR, 'word-lists.json')
const CUSTOM_WORDS_FILE = path.join(DATA_DIR, 'custom-words.json')
const DAILY_PRACTICE_FILE = path.join(DATA_DIR, 'daily-practice.json')
const LEARNING_POINTS_FILE = path.join(DATA_DIR, 'learning-points.json')

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.xlsx')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'))
    }
  }
})

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

// Helper functions for reading/writing custom words
const readCustomWords = () => {
  if (!fs.existsSync(CUSTOM_WORDS_FILE)) {
    return {}
  }
  try {
    const data = fs.readFileSync(CUSTOM_WORDS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading custom words file:', error)
    return {}
  }
}

const writeCustomWords = (data) => {
  try {
    fs.writeFileSync(CUSTOM_WORDS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing custom words file:', error)
    throw error
  }
}

// Helper functions for reading/writing daily practice
const readDailyPractice = () => {
  if (!fs.existsSync(DAILY_PRACTICE_FILE)) {
    return {}
  }
  try {
    const data = fs.readFileSync(DAILY_PRACTICE_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading daily practice file:', error)
    return {}
  }
}

const writeDailyPractice = (data) => {
  try {
    fs.writeFileSync(DAILY_PRACTICE_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing daily practice file:', error)
    throw error
  }
}

// Helper functions for reading/writing learning points
const readLearningPoints = () => {
  if (!fs.existsSync(LEARNING_POINTS_FILE)) {
    return {}
  }
  try {
    const data = fs.readFileSync(LEARNING_POINTS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading learning points file:', error)
    return {}
  }
}

const writeLearningPoints = (data) => {
  try {
    fs.writeFileSync(LEARNING_POINTS_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing learning points file:', error)
    throw error
  }
}

// Add learning points for a user on a specific date
const addLearningPoints = (userId, points) => {
  const allData = readLearningPoints()
  if (!allData[userId]) {
    allData[userId] = {}
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  if (!allData[userId][today]) {
    allData[userId][today] = 0
  }

  allData[userId][today] += points
  writeLearningPoints(allData)

  return allData[userId][today]
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

// Helper function to group words by topic
const groupWordsByTopic = (words) => {
  const topics = {
    'Numbers': ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'number'],
    'Colors': ['red', 'blue', 'green', 'yellow', 'black', 'white', 'color', 'pink', 'purple', 'orange', 'grey', 'brown'],
    'Family': ['mother', 'father', 'sister', 'brother', 'family', 'parent', 'child', 'son', 'daughter', 'grandmother', 'grandfather'],
    'Food': ['food', 'bread', 'water', 'coffee', 'tea', 'milk', 'fruit', 'meat', 'fish', 'restaurant', 'eat', 'drink', 'breakfast', 'lunch', 'dinner'],
    'Time': ['day', 'week', 'month', 'year', 'today', 'tomorrow', 'yesterday', 'hour', 'minute', 'morning', 'evening', 'night', 'time', 'clock'],
    'Body': ['head', 'hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'body', 'hair', 'face', 'leg', 'arm'],
    'Weather': ['weather', 'rain', 'sun', 'wind', 'cloud', 'snow', 'hot', 'cold', 'warm'],
    'Places': ['house', 'school', 'shop', 'street', 'city', 'country', 'hospital', 'church', 'bank', 'office', 'home'],
    'Transport': ['car', 'bus', 'train', 'plane', 'bicycle', 'taxi', 'station', 'airport', 'ticket'],
    'Clothes': ['shirt', 'dress', 'shoes', 'pants', 'jacket', 'hat', 'clothes', 'wear']
  }

  const grouped = {}
  words.forEach(word => {
    const english = word.english.toLowerCase()
    let assigned = false

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => english.includes(keyword))) {
        if (!grouped[topic]) grouped[topic] = []
        grouped[topic].push(word)
        assigned = true
        break
      }
    }

    if (!assigned) {
      if (!grouped['General']) grouped['General'] = []
      grouped['General'].push(word)
    }
  })

  return grouped
}

// Generate daily practice words for a user
const generateDailyWords = (userId, level, learnedWords = []) => {
  // First, try to get words from topic lists
  const listsData = readWordLists()
  const userLists = listsData[userId] || []

  // Get all topic lists
  const topicLists = userLists.filter(list => list.isTopic === true)

  // Collect all unlearned words from topic lists
  let topicUnlearnedWords = []
  topicLists.forEach(topicList => {
    const unlearnedInList = topicList.words.filter(w => !learnedWords.includes(w.greek))
    topicUnlearnedWords = topicUnlearnedWords.concat(unlearnedInList)
  })

  // If we have unlearned topic words, prioritize them
  if (topicUnlearnedWords.length > 0) {
    const shuffled = [...topicUnlearnedWords].sort(() => Math.random() - 0.5)
    const selectedWords = shuffled.slice(0, 10)

    return {
      words: selectedWords,
      topic: 'Topic-Based Practice'
    }
  }

  // Otherwise, fall back to level-based words
  const levelWords = dictionary.filter(w => w.level === level)
  const unlearnedWords = levelWords.filter(w => !learnedWords.includes(w.greek))

  if (unlearnedWords.length === 0) {
    return { words: [], topic: null }
  }

  const shuffled = [...unlearnedWords].sort(() => Math.random() - 0.5)
  const selectedWords = shuffled.slice(0, 10)

  return {
    words: selectedWords,
    topic: `${level} Level Practice`
  }
}

// Helper function to ensure default lists and clean up old ones
const ensureDefaultLists = (userId, userLists) => {
  let updated = false

  // Remove old deprecated lists (unstudied and learned) for all users
  const oldListIds = ['unstudied', 'learned']
  const beforeLength = userLists.length
  userLists.splice(0, userLists.length, ...userLists.filter(list => !oldListIds.includes(list.id)))
  if (userLists.length !== beforeLength) {
    updated = true
    console.log(`Removed deprecated lists for user ${userId}`)
  }

  // Migrate existing lists to use wordLearningPoints
  userLists.forEach(list => {
    if (!list.wordLearningPoints) {
      list.wordLearningPoints = {}
      // Migrate learned words to learning points (4 = completely learned)
      if (list.learnedWords && list.learnedWords.length > 0) {
        list.learnedWords.forEach(wordGreek => {
          list.wordLearningPoints[wordGreek] = 4
        })
      }
      updated = true
    }
    // Keep learnedWords for backwards compatibility (computed from wordLearningPoints)
    const computedLearnedWords = Object.keys(list.wordLearningPoints).filter(
      wordGreek => list.wordLearningPoints[wordGreek] >= 4
    )
    if (JSON.stringify(list.learnedWords) !== JSON.stringify(computedLearnedWords)) {
      list.learnedWords = computedLearnedWords
      updated = true
    }
  })

  // Create topic-based lists for beginners
  const topicLists = [
    {
      id: 'topic-numbers',
      name: '📊 Numbers',
      greekWords: ['ένας, μία, ένα', 'δύο', 'τρεις, τρία', 'τέσσερις, τέσσερα', 'πέντε', 'έξι', 'επτά (εφτά)', 'οχτώ (οκτώ)', 'εννέα (εννιά)', 'δέκα', 'έντεκα', 'δώδεκα', 'δεκατρείς, δεκατρία', 'δεκατέσσερις, δεκατέσσερα', 'δεκαπέντε', 'δεκαέξι', 'δεκαεπτά (δεκαεφτά)', 'δεκαοχτώ (δεκαοκτώ)', 'δεκαεννέα (δεκαεννιά)', 'είκοσι']
    },
    {
      id: 'topic-colors',
      name: '🎨 Colors',
      greekWords: ['άσπρος, -η, -ο', 'μαύρος, -η, -ο', 'κόκκινος, -η, -ο', 'γαλανός, -ή, -ό', 'πράσινο, το', 'κίτρινος, -η, -ο', 'πορτοκαλής, -ιά (/-ιά), -ί', 'ροζ', 'μωβ', 'καφέ', 'χρώμα, το']
    },
    {
      id: 'topic-family',
      name: '👨‍👩‍👧‍👦 Family',
      greekWords: ['μητέρα, η', 'μαμά, η', 'μπαμπάς, ο', 'αδερφός, ο', 'αδερφή, η', 'γιος, ο', 'κόρη, η', 'παιδί, το', 'οικογένεια, η', 'γιαγιά, η', 'παππούς, ο']
    },
    {
      id: 'topic-greetings',
      name: '👋 Greetings',
      greekWords: ['Γεια!', 'Γεια σας!', 'Γεια σου!', 'αντίο, το', 'Ευχαριστώ!', 'παρακαλώ', 'ναι', 'όχι', 'Συγνώμη!', 'Καλημέρα!', 'Καληνύχτα!']
    },
    {
      id: 'topic-food-drinks',
      name: '🍴 Food & Drinks',
      greekWords: ['ψωμί, το', 'νερό, το', 'γάλα, το', 'καφές, ο', 'τσάι, το', 'τυρί, το', 'κρέας, το', 'ψάρι, το', 'κοτόπουλο, το', 'ρύζι, το', 'σαλάτα, η', 'μήλο, το', 'μπανάνα, η', 'πορτοκάλι, το', 'λεμόνι, το', 'σταφύλι, το', 'φρούτο, το']
    },
    {
      id: 'topic-home',
      name: '🏠 Home',
      greekWords: ['σπίτι, το', 'κατοικία, η', 'δωμάτιο, το', 'κουζίνα, η', 'υπνοδωμάτιο, το', 'μπάνιο, το', 'πόρτα, η', 'παράθυρο, το', 'τραπέζι, το']
    },
    {
      id: 'topic-clothes',
      name: '👕 Clothes',
      greekWords: ['πουκάμισο, το', 'φόρεμα, το', 'παπούτσι, το', 'παντελόνι, το', 'μπουφάν, το', 'παλτό, το', 'καπέλο, το', 'φούστα, η', 'σακάκι, το', 'φανελάκι, το']
    },
    {
      id: 'topic-travel',
      name: '✈️ Travel',
      greekWords: ['ξενοδοχείο, το', 'αεροδρόμιο, το', 'τρένο, το', 'λεωφορείο, το', 'αυτοκίνητο, το', 'ταξί, το', 'εισιτήριο, το', 'διαβατήριο, το', 'βαλίτσα, η']
    },
    {
      id: 'topic-time-days',
      name: '📅 Time & Days',
      greekWords: ['Δευτέρα, η', 'Τρίτη, η', 'Τετάρτη, η', 'Πέμπτη, η', 'Παρασκευή, η', 'Σάββατο, το', 'Κυριακή, η', 'σήμερα', 'αύριο', 'χτες', '(ε)βδομάδα, η', 'μήνας, ο', 'χρόνος, ο', 'ημέρα, η', 'ώρα, η', 'μέρα, η']
    },
    {
      id: 'topic-verbs',
      name: '⚡ Basic Verbs',
      greekWords: ['είμαι', 'έχω', 'πηγαίνω', 'έρχομαι', 'τρώω, τρώγω', 'πίνω', 'μιλάω, -ώ', 'γράφω', 'διαβάζω', 'βλέπω', 'ακούω', 'ξέρω', 'θέλω', 'μ\' αρέσει', 'χρειάζομαι', 'κάνω', 'δίνω', 'παίρνω']
    },
    {
      id: 'topic-health',
      name: '🏥 Hospital & Health',
      greekWords: ['νοσοκομείο, το', 'γιατρός, ο/η', 'νοσοκόμος/-α, ο/η', 'ασθενής, ο/η', 'άρρωστος, -η, -ο', 'γερός, -ή, -ό', 'υγεία, η', 'υγιεινός, -ή, -ό', 'ιατρική, η', 'χάπι, το', 'φαρμακείο, το', 'πόνος, ο', 'πυρετός, ο', 'ραντεβού, το', 'θεραπεία, η']
    },
    {
      id: 'topic-shopping',
      name: '🛒 Shopping',
      greekWords: ['μαγαζί, το', 'αγοράζω', 'πουλάω', 'τιμή, η', 'χρήματα, τα', 'ευρώ, το', 'σούπερ μάρκετ, το', 'πληρώνω', 'μετρητά, τα', 'κάρτα, η', 'ακριβός, -ή, -ό', 'φτηνός, -ή, -ό', 'ανοιχτ-ός, -ή, -ό', 'πωλητής/-τρια, ο/η']
    },
    {
      id: 'topic-body',
      name: '👤 Body Parts',
      greekWords: ['κεφάλι, το', 'χέρι, το', 'πόδι/πόδια, το/τα', 'μάτι, το', 'αυτί, το', 'μύτη, η', 'στόμα, το', 'σώμα, το', 'μαλλιά, τα', 'πρόσωπο, το']
    }
  ]

  topicLists.forEach(topicDef => {
    // Check if topic list already exists
    let topicList = userLists.find(list => list.id === topicDef.id)

    if (!topicList) {
      // Create new topic list
      const words = topicDef.greekWords
        .map(greekWord => dictionary.find(w => w.greek === greekWord))
        .filter(w => w != null)

      if (words.length > 0) {
        topicList = {
          id: topicDef.id,
          name: topicDef.name,
          words: words.map(word => ({ ...word })),
          learnedWords: [],
          wordLearningPoints: {},
          isTopic: true,
          isReadOnly: true // Can't add/remove words, but can delete whole list
        }
        userLists.push(topicList)
        updated = true
      }
    }
  })

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
        wordLearningPoints: {},
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

// API Route for learning points history
app.get('/api/progress/:userId/learning-points', (req, res) => {
  const { userId } = req.params
  const allData = readLearningPoints()
  const userPoints = allData[userId] || {}

  // Generate last 30 days
  const days = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    days.push({
      date: dateStr,
      points: userPoints[dateStr] || 0
    })
  }

  // Calculate total learning points
  const totalPoints = Object.values(userPoints).reduce((sum, points) => sum + points, 0)

  res.json({
    history: days,
    totalPoints
  })
})

// API Routes for word lists
app.get('/api/lists/:userId', (req, res) => {
  const { userId} = req.params
  let allData = readWordLists()
  if (!allData[userId]) allData[userId] = []

  const updated = ensureDefaultLists(userId, allData[userId])
  if (updated) {
    writeWordLists(allData)
  }

  // Sort lists: custom → topic → level
  const sortedLists = allData[userId].sort((a, b) => {
    // Custom lists (no isTopic, no isDefault) come first
    const aIsCustom = !a.isTopic && !a.isDefault
    const bIsCustom = !b.isTopic && !b.isDefault
    if (aIsCustom && !bIsCustom) return -1
    if (!aIsCustom && bIsCustom) return 1

    // Topic lists come second
    const aIsTopic = a.isTopic === true
    const bIsTopic = b.isTopic === true
    if (aIsTopic && !bIsTopic) return -1
    if (!aIsTopic && bIsTopic) return 1

    // Level lists come last (both have isDefault=true)
    // Keep their original order (A1, A2, B1, B2)
    return 0
  })

  res.json({ lists: sortedLists })
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
    wordLearningPoints: {},
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

  // Initialize wordLearningPoints if it doesn't exist
  if (!list.wordLearningPoints) {
    list.wordLearningPoints = {}
  }

  // Increment learning points (max 4)
  const currentPoints = list.wordLearningPoints[wordGreek] || 0
  const newPoints = Math.min(currentPoints + 1, 4)
  list.wordLearningPoints[wordGreek] = newPoints

  // Track daily learning points (+1 point for each mark as learned action)
  addLearningPoints(userId, 1)

  // Update learnedWords for backwards compatibility (words with 4+ points)
  list.learnedWords = Object.keys(list.wordLearningPoints).filter(
    word => list.wordLearningPoints[word] >= 4
  )

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

  const decodedWord = decodeURIComponent(wordGreek)

  // Reset learning points to 0
  if (list.wordLearningPoints) {
    delete list.wordLearningPoints[decodedWord]
  }

  // Update learnedWords for backwards compatibility
  list.learnedWords = list.learnedWords.filter(w => w !== decodedWord)
  writeWordLists(allData)

  res.json({ list })
})

// API Routes for custom words
app.get('/api/custom-words/:userId', (req, res) => {
  const { userId } = req.params
  const allWords = readCustomWords()
  const userWords = allWords[userId] || []

  res.json({ words: userWords })
})

app.post('/api/custom-words/:userId', (req, res) => {
  const { userId } = req.params
  const { greek, english, pos } = req.body

  if (!greek || !greek.trim() || !english || !english.trim()) {
    return res.status(400).json({ error: 'Greek and English text are required' })
  }

  const allWords = readCustomWords()
  if (!allWords[userId]) allWords[userId] = []

  // Check if word already exists
  if (allWords[userId].some(w => w.greek === greek.trim())) {
    return res.status(400).json({ error: 'This word already exists in your custom dictionary' })
  }

  // Limit to 500 custom words per user
  if (allWords[userId].length >= 500) {
    return res.status(400).json({ error: 'Maximum 500 custom words per user' })
  }

  const newWord = {
    greek: greek.trim(),
    greek_normalized: greek.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    english: english.trim(),
    pos: pos?.trim() || '',
    level: 'Custom',
    isCustom: true,
    createdAt: new Date().toISOString()
  }

  allWords[userId].push(newWord)
  writeCustomWords(allWords)

  res.json({ word: newWord })
})

app.delete('/api/custom-words/:userId/:greekWord', (req, res) => {
  const { userId, greekWord } = req.params
  const allWords = readCustomWords()

  if (!allWords[userId]) {
    return res.status(404).json({ error: 'User not found' })
  }

  const decodedWord = decodeURIComponent(greekWord)
  allWords[userId] = allWords[userId].filter(w => w.greek !== decodedWord)
  writeCustomWords(allWords)

  res.json({ success: true })
})

// Upload custom words from CSV/Excel file
app.post('/api/custom-words/:userId/upload', upload.single('file'), (req, res) => {
  const { userId } = req.params
  const { listName } = req.body

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  if (!listName || !listName.trim()) {
    return res.status(400).json({ error: 'List name is required' })
  }

  try {
    let words = []

    // Parse the file based on type
    if (req.file.originalname.endsWith('.csv') || req.file.mimetype === 'text/csv') {
      // Parse CSV
      const csvData = req.file.buffer.toString('utf8')
      const lines = csvData.split(/\r?\n/).filter(line => line.trim())

      for (const line of lines) {
        // Split by comma, handling quoted values
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
        if (parts.length >= 2) {
          const greek = parts[0].replace(/^"|"$/g, '').trim()
          const english = parts[1].replace(/^"|"$/g, '').trim()

          if (greek && english) {
            words.push({ greek, english, pos: '' })
          }
        }
      }
    } else {
      // Parse Excel
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 })

      for (const row of data) {
        if (row.length >= 2 && row[0] && row[1]) {
          const greek = String(row[0]).trim()
          const english = String(row[1]).trim()

          if (greek && english) {
            words.push({ greek, english, pos: '' })
          }
        }
      }
    }

    if (words.length === 0) {
      return res.status(400).json({ error: 'No valid words found in file. Please ensure the file has two columns: Greek word and English translation.' })
    }

    // Add all words to custom words
    const allCustomWords = readCustomWords()
    if (!allCustomWords[userId]) {
      allCustomWords[userId] = []
    }

    // Add words (allow duplicates)
    for (const word of words) {
      allCustomWords[userId].push(word)
    }

    writeCustomWords(allCustomWords)

    // Create a new list with these words
    const allLists = readLists()
    if (!allLists[userId]) {
      allLists[userId] = []
    }

    const newList = {
      id: `list-${Date.now()}`,
      name: listName.trim(),
      words: words,
      learnedWords: [],
      wordLearningPoints: {},
      isDefault: false,
      createdAt: new Date().toISOString()
    }

    allLists[userId].push(newList)
    writeWordLists(allLists)

    res.json({
      success: true,
      wordsAdded: words.length,
      list: newList
    })
  } catch (error) {
    console.error('Error processing upload:', error)
    res.status(500).json({ error: 'Failed to process file. Please check the file format.' })
  }
})

// Translation API endpoint
app.post('/api/translate', async (req, res) => {
  const { text, from, to } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' })
  }

  try {
    // Use MyMemory Translation API (free, no API key required)
    const langpair = `${from || 'en'}|${to || 'el'}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${langpair}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`MyMemory Translation API error (${response.status}):`, errorText)
      throw new Error(`Translation API returned ${response.status}`)
    }

    const data = await response.json()
    console.log('MyMemory Translation response:', data)

    if (data.responseStatus !== 200) {
      throw new Error(`Translation failed: ${data.responseDetails || 'Unknown error'}`)
    }

    const translation = data.responseData?.translatedText || ''

    res.json({ translation })
  } catch (error) {
    console.error('Translation error:', error.message)

    // Fallback: Allow manual entry
    res.json({
      translation: '',
      error: 'Auto-translation unavailable. Please enter translation manually.'
    })
  }
})

// Daily Practice API endpoints
app.get('/api/daily-practice/:userId', (req, res) => {
  const { userId } = req.params
  const allData = readDailyPractice()
  const userData = allData[userId]

  if (!userData) {
    return res.json({ needsSetup: true })
  }

  const today = new Date().toDateString()

  // Check if we need to refresh (new day or words learned)
  if (userData.date !== today || userData.words.length < 10) {
    // Get user's learned words from progress
    const progress = readProgress()
    const userProgress = progress[userId] || { memorizedWords: [] }

    // Also get learned words from all lists
    const listsData = readWordLists()
    const userLists = listsData[userId] || []
    const allLearnedWords = new Set(userProgress.memorizedWords)

    userLists.forEach(list => {
      if (list.learnedWords) {
        list.learnedWords.forEach(w => allLearnedWords.add(w))
      }
    })

    // Generate new daily words
    const { words, topic } = generateDailyWords(userId, userData.level, Array.from(allLearnedWords))

    userData.words = words
    userData.topic = topic
    userData.date = today
    allData[userId] = userData
    writeDailyPractice(allData)
  }

  res.json({
    needsSetup: false,
    level: userData.level,
    words: userData.words,
    topic: userData.topic,
    date: userData.date
  })
})

app.post('/api/daily-practice/:userId/setup', (req, res) => {
  const { userId } = req.params
  const { level } = req.body

  if (!level || !['A1', 'A2', 'B1', 'B2'].includes(level)) {
    return res.status(400).json({ error: 'Valid level (A1, A2, B1, B2) is required' })
  }

  const allData = readDailyPractice()
  const today = new Date().toDateString()

  // Get user's learned words
  const progress = readProgress()
  const userProgress = progress[userId] || { memorizedWords: [] }

  const listsData = readWordLists()
  const userLists = listsData[userId] || []
  const allLearnedWords = new Set(userProgress.memorizedWords)

  userLists.forEach(list => {
    if (list.learnedWords) {
      list.learnedWords.forEach(w => allLearnedWords.add(w))
    }
  })

  // Generate initial daily words
  const { words, topic } = generateDailyWords(userId, level, Array.from(allLearnedWords))

  allData[userId] = {
    level,
    words,
    topic,
    date: today
  }

  writeDailyPractice(allData)

  res.json({
    level,
    words,
    topic,
    date: today
  })
})

app.put('/api/daily-practice/:userId/level', (req, res) => {
  const { userId } = req.params
  const { level } = req.body

  if (!level || !['A1', 'A2', 'B1', 'B2'].includes(level)) {
    return res.status(400).json({ error: 'Valid level (A1, A2, B1, B2) is required' })
  }

  const allData = readDailyPractice()
  const userData = allData[userId]

  if (!userData) {
    return res.status(404).json({ error: 'User daily practice not found' })
  }

  // Update level and regenerate words
  userData.level = level

  const progress = readProgress()
  const userProgress = progress[userId] || { memorizedWords: [] }

  const listsData = readWordLists()
  const userLists = listsData[userId] || []
  const allLearnedWords = new Set(userProgress.memorizedWords)

  userLists.forEach(list => {
    if (list.learnedWords) {
      list.learnedWords.forEach(w => allLearnedWords.add(w))
    }
  })

  const { words, topic } = generateDailyWords(userId, level, Array.from(allLearnedWords))

  userData.words = words
  userData.topic = topic
  userData.date = new Date().toDateString()

  allData[userId] = userData
  writeDailyPractice(allData)

  res.json({
    level: userData.level,
    words: userData.words,
    topic: userData.topic
  })
})

// Handle React Router - serve index.html for all routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Progress data will be stored in ${DATA_DIR}`)
})