#!/bin/bash

# Store Location Engine - Backend Deployment Script
# This script deploys the optimized backend to Supabase

echo "🚀 Deploying Store Location Engine Backend..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found!"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Copy the optimized server code to the deployment directory
echo "📁 Preparing deployment files..."
cp /supabase/functions/server/index.tsx /supabase/functions/make-server-26050ec2/index.ts
cp /supabase/functions/server/kv_store_clean.tsx /supabase/functions/make-server-26050ec2/kv_store_clean.ts

echo "✅ Files copied to deployment directory"
echo ""

# Deploy the function
echo "🔄 Deploying to Supabase..."
supabase functions deploy make-server-26050ec2 --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🌐 Your API is now live at:"
    echo "   https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores"
    echo ""
    echo "🧪 Test it with:"
    echo "   curl \"https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=90210&radius=50\" \\"
    echo "     -H \"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE\""
    echo ""
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "Please check the error messages above."
    exit 1
fi
