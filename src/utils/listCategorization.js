/**
 * Categorizes word lists into three groups and sorts each by learned percentage
 * @param {Array} lists - Array of word lists
 * @returns {Object} - Object with customLists, topicLists, and levelLists arrays
 */
export const categorizeAndSortLists = (lists) => {
  // Calculate learned percentage for a list
  const getLearnedPercentage = (list) => {
    const totalWords = list.words.length
    const learnedWords = list.learnedWords.length
    return totalWords > 0 ? (learnedWords / totalWords) * 100 : 0
  }

  // Sort by learned percentage (descending - higher percentage first)
  const sortByLearnedPercentage = (a, b) => {
    return getLearnedPercentage(b) - getLearnedPercentage(a)
  }

  // Category 1: Custom user-defined lists (no isTopic, no isDefault)
  const customLists = lists
    .filter(l => !l.isTopic && !l.isDefault)
    .sort(sortByLearnedPercentage)

  // Category 2: Topic-based pre-defined lists
  const topicLists = lists
    .filter(l => l.isTopic === true)
    .sort(sortByLearnedPercentage)

  // Category 3: Level-based default lists
  const levelLists = lists
    .filter(l => l.isDefault === true)
    .sort(sortByLearnedPercentage)

  return {
    customLists,
    topicLists,
    levelLists
  }
}
