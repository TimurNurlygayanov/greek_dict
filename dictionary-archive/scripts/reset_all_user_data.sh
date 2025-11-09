#!/bin/bash
# Complete User Data Reset Script
# Clears all user progress, custom words, and word lists
# Use after migrating to new clean dictionaries

set -e

DATA_DIR="${DATA_DIR:-./data}"

echo "=================================="
echo "RESET ALL USER DATA"
echo "=================================="
echo ""
echo "⚠️  This will delete:"
echo "   - All user progress"
echo "   - All custom word lists"
echo "   - All custom words"
echo "   - All daily practice settings"
echo "   - All server-side user data"
echo ""
echo "Users will start fresh with the new clean dictionaries"
echo ""
read -p "Are you absolutely sure? (type 'DELETE' to confirm): " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "Step 1: Creating backup of all user data..."
BACKUP_DIR="user_data_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "$DATA_DIR" ]; then
    cp -r "$DATA_DIR" "$BACKUP_DIR/"
    echo "   ✅ Backup saved to $BACKUP_DIR/"
else
    echo "   ℹ️  No data directory found (clean install)"
fi

echo ""
echo "Step 2: Clearing server-side data files..."

if [ -f "$DATA_DIR/progress.json" ]; then
    echo "{}" > "$DATA_DIR/progress.json"
    echo "   ✅ Cleared progress.json"
else
    echo "   ℹ️  progress.json not found"
fi

if [ -f "$DATA_DIR/word-lists.json" ]; then
    echo "{}" > "$DATA_DIR/word-lists.json"
    echo "   ✅ Cleared word-lists.json"
else
    echo "   ℹ️  word-lists.json not found"
fi

if [ -f "$DATA_DIR/custom-words.json" ]; then
    echo "{}" > "$DATA_DIR/custom-words.json"
    echo "   ✅ Cleared custom-words.json"
else
    echo "   ℹ️  custom-words.json not found"
fi

if [ -f "$DATA_DIR/daily-practice.json" ]; then
    echo "{}" > "$DATA_DIR/daily-practice.json"
    echo "   ✅ Cleared daily-practice.json"
else
    echo "   ℹ️  daily-practice.json not found"
fi

echo ""
echo "Step 3: Verifying dictionary files..."
for level in A1 A2 B1 B2; do
    if [ -f "dictionary_${level}.json" ]; then
        entries=$(node -e "console.log(JSON.parse(require('fs').readFileSync('dictionary_${level}.json', 'utf8')).length)")
        echo "   ✅ dictionary_${level}.json: $entries entries"
    else
        echo "   ⚠️  dictionary_${level}.json NOT FOUND!"
    fi
done

echo ""
echo "=================================="
echo "✅ USER DATA RESET COMPLETE!"
echo "=================================="
echo ""
echo "Server-side data has been cleared."
echo "Client-side localStorage will be cleared on first visit."
echo ""
echo "Next steps:"
echo "1. Restart your server"
echo "2. Clear browser cache/localStorage (or open in incognito)"
echo "3. Test with a fresh user account"
echo ""
echo "Backup location: $BACKUP_DIR/"
echo ""
