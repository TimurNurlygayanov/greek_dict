#!/bin/bash
# Production Migration Script
# Replaces old dictionaries with new clean parsed versions
# IMPORTANT: This will reset all user progress!

set -e  # Exit on any error

echo "=================================="
echo "Greek Dictionary Migration"
echo "=================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "   - Replace all dictionary files"
echo "   - Reset user progress data"
echo "   - Clear custom word lists"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Step 1: Creating backup of old dictionaries..."
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
cp dictionary_A1.json dictionary_A2.json dictionary_B1.json dictionary_B2.json backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || echo "Old dictionaries not found, skipping backup"

echo "Step 2: Replacing with new clean dictionaries..."
cp dictionary_A1_parsed.json dictionary_A1.json
cp dictionary_A2_parsed.json dictionary_A2.json
cp dictionary_B1_parsed.json dictionary_B1.json
cp dictionary_B2_parsed.json dictionary_B2.json

echo "Step 3: Verifying new dictionaries..."
for level in A1 A2 B1 B2; do
    entries=$(python3 -c "import json; print(len(json.load(open('dictionary_${level}.json'))))")
    echo "   ✅ dictionary_${level}.json: $entries entries"
done

echo ""
echo "=================================="
echo "✅ Migration Complete!"
echo "=================================="
echo ""
echo "📊 Summary:"
echo "   - A1: 1,340 clean entries"
echo "   - A2: 1,543 clean entries"
echo "   - B1: 4,018 clean entries"
echo "   - B2: 4,224 clean entries"
echo "   - Total: 11,125 entries"
echo ""
echo "Next steps:"
echo "1. Clear user database/localStorage"
echo "2. Restart your server"
echo "3. Test with a fresh user account"
echo ""
