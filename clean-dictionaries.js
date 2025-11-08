#!/usr/bin/env node

/**
 * Clean dictionary files by removing:
 * - Corrupted entries (with � characters)
 * - Proper names (Greek names, country names)
 * - Language phrases (e.g., "αγγλική γλώσσα")
 * - Overly long or complex entries
 * - Suspicious patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Filtering rules
const filters = {
  // Check for corrupted characters
  isCorrupted: (word) => {
    return word.greek.includes('�') || word.english.includes('�');
  },

  // Check if it's a proper name (starts with capital and is a name)
  isProperName: (word) => {
    const greekFirstChar = word.greek.charAt(0);
    const isCapitalized = greekFirstChar === greekFirstChar.toUpperCase() &&
                          greekFirstChar !== greekFirstChar.toLowerCase();

    // Common name indicators in English
    const nameIndicators = [
      'Angelo', 'Angelica', 'Andrea', 'Alexandra', 'Alexander',
      'Sofia', 'Maria', 'George', 'Nicholas', 'Constantine',
      'Dimitri', 'Helen', 'Christina', 'Theodore', 'Sophia'
    ];

    if (isCapitalized) {
      // Check if English translation is a name
      const englishWords = word.english.split(/[\s,]+/);
      for (const indicator of nameIndicators) {
        if (englishWords.some(w => w === indicator)) {
          return true;
        }
      }
    }

    return false;
  },

  // Check if it's a country/nationality
  isCountryOrNationality: (word) => {
    const countries = [
      'England', 'Albania', 'Armenia', 'Brazil', 'Bulgaria',
      'France', 'Germany', 'Japan', 'Denmark', 'Russia',
      'China', 'Italy', 'Spain', 'Portugal', 'Greece'
    ];

    return countries.some(country =>
      word.english.includes(country) ||
      word.greek.includes(country)
    );
  },

  // Check if it's a language phrase
  isLanguagePhrase: (word) => {
    return word.greek.includes('γλώσσα') ||
           word.english.toLowerCase().includes('language') ||
           (word.greek.includes('(/') && word.greek.length > 30);
  },

  // Check if entry is too long or complex
  isTooComplex: (word) => {
    // Too long
    if (word.greek.length > 60 || word.english.length > 100) {
      return true;
    }

    // Too many special characters
    const specialChars = (word.greek.match(/[\/\(\)\[\]\{\}]/g) || []).length;
    if (specialChars > 3) {
      return true;
    }

    return false;
  },

  // Check if English translation looks suspicious
  hasSuspiciousEnglish: (word) => {
    const english = word.english.toLowerCase();

    // Contains Greek characters in English field
    if (/[α-ωΑ-Ω]/.test(word.english)) {
      return true;
    }

    // Too many spaces (likely a phrase, not a word)
    const spaceCount = (english.match(/ /g) || []).length;
    if (spaceCount > 5) {
      return true;
    }

    return false;
  },

  // Check if it's empty or invalid
  isEmpty: (word) => {
    return !word.greek || !word.english ||
           word.greek.trim().length === 0 ||
           word.english.trim().length === 0;
  }
};

// Process a single dictionary
function cleanDictionary(words, level) {
  const stats = {
    original: words.length,
    corrupted: 0,
    properNames: 0,
    countriesNationalities: 0,
    languagePhrases: 0,
    tooComplex: 0,
    suspiciousEnglish: 0,
    empty: 0,
    multipleIssues: 0,
    cleaned: 0
  };

  const cleaned = words.filter(word => {
    const issues = [];

    if (filters.isEmpty(word)) {
      stats.empty++;
      issues.push('empty');
    }
    if (filters.isCorrupted(word)) {
      stats.corrupted++;
      issues.push('corrupted');
    }
    if (filters.isProperName(word)) {
      stats.properNames++;
      issues.push('properName');
    }
    if (filters.isCountryOrNationality(word)) {
      stats.countriesNationalities++;
      issues.push('country');
    }
    if (filters.isLanguagePhrase(word)) {
      stats.languagePhrases++;
      issues.push('language');
    }
    if (filters.isTooComplex(word)) {
      stats.tooComplex++;
      issues.push('complex');
    }
    if (filters.hasSuspiciousEnglish(word)) {
      stats.suspiciousEnglish++;
      issues.push('suspicious');
    }

    if (issues.length > 1) {
      stats.multipleIssues++;
    }

    // Keep only if no issues
    return issues.length === 0;
  });

  stats.cleaned = cleaned.length;
  stats.removed = stats.original - stats.cleaned;
  stats.removalRate = Math.round((stats.removed / stats.original) * 100);

  return { cleaned, stats };
}

// Main execution
console.log('🧹 Starting dictionary cleaning process...\n');

const levels = ['A1', 'A2', 'B1', 'B2'];
const allStats = {};

levels.forEach(level => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Processing ${level} dictionary`);
  console.log('='.repeat(50));

  const inputPath = path.join(__dirname, `dictionary_${level}.json`);
  const outputPath = path.join(__dirname, `dictionary_${level}_cleaned.json`);

  try {
    // Read dictionary
    const words = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(`\n📖 Read ${words.length} words`);

    // Clean dictionary
    const { cleaned, stats } = cleanDictionary(words, level);
    allStats[level] = stats;

    // Save cleaned dictionary
    fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), 'utf8');
    console.log(`\n✅ Saved ${cleaned.length} cleaned words to dictionary_${level}_cleaned.json`);

    // Print statistics
    console.log('\n📊 Cleaning Statistics:');
    console.log('─────────────────────────────────');
    console.log(`Original entries:          ${stats.original}`);
    console.log(`Cleaned entries:           ${stats.cleaned}`);
    console.log(`Removed entries:           ${stats.removed} (${stats.removalRate}%)`);
    console.log('\n🗑️  Removed by reason:');
    console.log(`  Corrupted:               ${stats.corrupted}`);
    console.log(`  Proper names:            ${stats.properNames}`);
    console.log(`  Countries/nationalities: ${stats.countriesNationalities}`);
    console.log(`  Language phrases:        ${stats.languagePhrases}`);
    console.log(`  Too complex:             ${stats.tooComplex}`);
    console.log(`  Suspicious English:      ${stats.suspiciousEnglish}`);
    console.log(`  Empty/invalid:           ${stats.empty}`);
    console.log(`  Multiple issues:         ${stats.multipleIssues}`);

  } catch (error) {
    console.error(`\n❌ Error processing ${level}:`, error.message);
  }
});

// Print summary
console.log('\n\n' + '='.repeat(50));
console.log('📈 OVERALL SUMMARY');
console.log('='.repeat(50));

let totalOriginal = 0;
let totalCleaned = 0;
let totalRemoved = 0;

levels.forEach(level => {
  if (allStats[level]) {
    totalOriginal += allStats[level].original;
    totalCleaned += allStats[level].cleaned;
    totalRemoved += allStats[level].removed;

    console.log(`\n${level}:`);
    console.log(`  ${allStats[level].original} → ${allStats[level].cleaned} (${allStats[level].removalRate}% removed)`);
  }
});

const overallRemovalRate = Math.round((totalRemoved / totalOriginal) * 100);

console.log('\n' + '─'.repeat(50));
console.log(`Total original:  ${totalOriginal}`);
console.log(`Total cleaned:   ${totalCleaned}`);
console.log(`Total removed:   ${totalRemoved} (${overallRemovalRate}%)`);
console.log('\n✨ Cleaning complete! Cleaned files saved with "_cleaned" suffix.\n');
