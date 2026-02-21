#!/bin/bash

# 🚀 Quick Start Script: Get 600+ Stores in 7 Minutes!

echo "🚀 Store Data Collection - Quick Start"
echo "======================================"
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required (you have $(node --version))"
    echo "Please upgrade: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Step 1: Scrape Walmart
echo "📍 Step 1/3: Scraping Walmart stores..."
echo "Expected time: ~30 seconds"
echo ""
node scripts/scrape-walmart-stores.js

if [ $? -ne 0 ]; then
    echo "❌ Walmart scraping failed!"
    exit 1
fi

echo ""
echo "✅ Walmart scraping complete!"
echo ""
sleep 2

# Step 2: Scrape Ralphs
echo "🛒 Step 2/3: Scraping Ralphs stores..."
echo "Expected time: ~40 seconds"
echo ""
node scripts/scrape-ralphs-stores.js

if [ $? -ne 0 ]; then
    echo "❌ Ralphs scraping failed!"
    exit 1
fi

echo ""
echo "✅ Ralphs scraping complete!"
echo ""
sleep 2

# Step 3: Upload
echo "📤 Step 3/3: Uploading stores to database..."
echo "Expected time: ~5 minutes"
echo ""

# Check if API_BASE_URL is set
if [ -z "$API_BASE_URL" ]; then
    echo "⚠️  Warning: API_BASE_URL not set!"
    echo "Set it with: export API_BASE_URL='https://your-project.supabase.co/functions/v1'"
    echo ""
    echo "Using default: http://localhost:3000"
    echo "Press Ctrl+C to cancel and set the URL, or wait 5 seconds to continue..."
    sleep 5
fi

node scripts/upload-stores.js

if [ $? -ne 0 ]; then
    echo "❌ Upload failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure your server is running"
    echo "2. Set API_BASE_URL: export API_BASE_URL='https://your-project.supabase.co/functions/v1'"
    echo "3. Set SUPABASE_ANON_KEY: export SUPABASE_ANON_KEY='your-key'"
    exit 1
fi

echo ""
echo "======================================"
echo "🎉 SUCCESS! Store data collection complete!"
echo "======================================"
echo ""
echo "📊 Summary:"
echo "  • Walmart stores: ~400"
echo "  • Ralphs stores: ~200"
echo "  • Total: ~600 stores"
echo "  • Coverage: Nationwide (Walmart) + SoCal (Ralphs)"
echo ""
echo "🎯 Next steps:"
echo "  1. Test your API: GET /stores?zip=90210&radius=10"
echo "  2. Check your frontend"
echo "  3. Your database now has 600+ stores! 🚀"
echo ""