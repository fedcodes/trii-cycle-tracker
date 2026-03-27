#!/bin/bash
# trii Cycle Tracker — GitHub + Vercel Setup
# Run this from the trii-cycle-tracker directory

set -e

echo "🟢 trii Cycle Tracker — Setup"
echo ""

# 1. Create GitHub repo
echo "📦 Creating GitHub repository..."
gh repo create trii-cycle-tracker --private --source=. --push --remote=origin
echo "✅ Repository created and code pushed"

# 2. Deploy to Vercel (links to GitHub repo)
echo ""
echo "🚀 Deploying to Vercel..."
npx vercel --yes
echo ""
echo "✅ Deployed! Run 'npx vercel --prod' to promote to production."
echo ""
echo "🔒 To add password protection:"
echo "   1. Go to your Vercel project settings"
echo "   2. Navigate to Security > Password Protection"
echo "   3. Enable and set your password"
