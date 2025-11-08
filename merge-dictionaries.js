#!/usr/bin/env node

/**
 * Merge cleaned dictionaries from different levels (A1, A2, B1, B2)
 * Each word gets tagged with its LOWEST required level
 * No duplicates - if a word appears in multiple levels, we keep the lowest level tag
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all dictionary files
const levels = ['A1', 'A2', 'B1', 'B2'];
const dictionaries = {};

console.log('Reading dictionary files...\n');

levels.forEach(level => {
  const filePath = path.join(__dirname, `dictionary_${level}_cleaned.json`);
  try {
    dictionaries[level] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`✓ ${level}: ${dictionaries[level].length} words`);
  } catch (error) {
    console.error(`✗ Error reading ${level}:`, error.message);
    process.exit(1);
  }
});

console.log('\nMerging dictionaries...\n');

// Use a Map to track unique words (key = greek text)
const wordMap = new Map();
const stats = {
  A1: 0,
  A2: 0,
  B1: 0,
  B2: 0,
  total: 0,
  duplicates: 0
};

// Process each level in order (A1 -> A2 -> B1 -> B2)
// This ensures lowest level wins for duplicates
levels.forEach(level => {
  dictionaries[level].forEach(word => {
    const key = word.greek; // Use greek text as unique identifier

    if (!wordMap.has(key)) {
      // New word - add with current level
      wordMap.set(key, {
        ...word,
        level: level
      });
      stats[level]++;
      stats.total++;
    } else {
      // Duplicate word - keep the one with lower level (already set)
      stats.duplicates++;
    }
  });
});

// Convert map to array and sort by level, then alphabetically
const mergedDictionary = Array.from(wordMap.values()).sort((a, b) => {
  // Sort by level first (A1 < A2 < B1 < B2)
  const levelOrder = { A1: 0, A2: 1, B1: 2, B2: 3 };
  if (levelOrder[a.level] !== levelOrder[b.level]) {
    return levelOrder[a.level] - levelOrder[b.level];
  }
  // Then sort alphabetically by greek text
  return a.greek.localeCompare(b.greek, 'el');
});

// Write merged dictionary
const outputPath = path.join(__dirname, 'src', 'dictionary.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedDictionary, null, 2), 'utf8');

console.log('Merge complete!\n');
console.log('Statistics:');
console.log('─────────────────────────');
console.log(`A1 words: ${stats.A1}`);
console.log(`A2 words (new): ${stats.A2}`);
console.log(`B1 words (new): ${stats.B1}`);
console.log(`B2 words (new): ${stats.B2}`);
console.log(`─────────────────────────`);
console.log(`Total unique words: ${stats.total}`);
console.log(`Duplicates avoided: ${stats.duplicates}`);
console.log(`\n✓ Merged dictionary saved to: ${outputPath}`);
console.log('\nLevel distribution:');
console.log(`A1: ${stats.A1} (${Math.round(stats.A1 / stats.total * 100)}%)`);
console.log(`A2: ${stats.A2} (${Math.round(stats.A2 / stats.total * 100)}%)`);
console.log(`B1: ${stats.B1} (${Math.round(stats.B1 / stats.total * 100)}%)`);
console.log(`B2: ${stats.B2} (${Math.round(stats.B2 / stats.total * 100)}%)`);
