# GitHub Setup & Deployment Guide

Your local repository is ready! Follow these steps to push to GitHub and deploy.

## Step 1: Create GitHub Repository

1. **Go to GitHub**: [https://github.com/new](https://github.com/new)

2. **Repository Settings**:
   - **Repository name**: `pakistan-economic-observatory` (or your preferred name)
   - **Description**: "Interactive dashboard for analyzing market integration and price dynamics across Pakistani cities"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click**: "Create repository"

## Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pakistan-economic-observatory.git

# Rename branch to main (GitHub's default)
git branch -M main

# Push your code
git push -u origin main
```

### Run these commands in PowerShell:

```powershell
cd "e:/Dicrete Website Folder/Submission_Package/react_app"

# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/pakistan-economic-observatory.git

git branch -M main

git push -u origin main
```

You'll be prompted to login to GitHub. After that, your code will be pushed!

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. **Go to**: [https://vercel.com](https://vercel.com)
2. **Sign up/Login** with your GitHub account
3. **Click**: "Add New Project"
4. **Select**: Your `pakistan-economic-observatory` repository
5. **Configure**:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Click**: "Deploy"

**Your site will be live in ~2 minutes!** 🎉

### Option B: Via Vercel CLI (Alternative)

If you can run npm commands:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

## Step 4: Get Your Live URL

After deployment, Vercel will provide you with:
- **Preview URL**: `https://pakistan-economic-observatory-xyz.vercel.app`
- **Production URL**: `https://pakistan-economic-observatory.vercel.app`

You can customize the domain in Vercel settings!

## Troubleshooting

### "Permission denied" when pushing to GitHub
- Make sure you're logged into GitHub
- Use GitHub Desktop as an alternative
- Or use SSH keys instead of HTTPS

### Build fails on Vercel
- Check that `package.json` has all dependencies
- Verify Node.js version (should be 18+)
- Check build logs in Vercel dashboard

### Need to update the deployed site?
Just push to GitHub:
```bash
git add .
git commit -m "Update dashboard"
git push
```
Vercel will automatically redeploy!

## Alternative: GitHub Desktop (If CLI doesn't work)

1. **Download**: [GitHub Desktop](https://desktop.github.com/)
2. **Install** and login
3. **Add repository**: File → Add Local Repository
4. **Select**: `e:/Dicrete Website Folder/Submission_Package/react_app`
5. **Publish**: Click "Publish repository" button
6. **Done!** Then follow Step 3 for Vercel deployment

## Quick Reference

### Your Repository Status
✅ Git initialized
✅ Initial commit made
✅ README.md created
✅ .gitignore configured
⏳ Waiting for GitHub remote

### Next Actions
1. Create GitHub repository
2. Add remote origin
3. Push to GitHub
4. Deploy on Vercel

---

**Need help?** Open an issue on GitHub or check the [Vercel Documentation](https://vercel.com/docs)
