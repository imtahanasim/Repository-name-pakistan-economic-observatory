# Deployment Guide

This guide provides instructions for deploying the Pakistan Economic Observatory dashboard to various hosting platforms.

## Prerequisites

- The application has been built successfully (`npm run build`)
- You have a `dist` folder in the project root
- You have a GitHub account (recommended for easiest deployment)

## Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest and fastest way to deploy React applications.

### Steps:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from the project directory**:
   ```bash
   cd "e:/Dicrete Website Folder/Submission_Package/react_app"
   vercel
   ```

3. **Follow the prompts**:
   - Login to your Vercel account (it will open a browser)
   - Confirm project settings
   - Vercel will automatically detect it's a Vite project

4. **Your site will be live!**
   - Vercel will provide you with a URL like `https://your-project.vercel.app`
   - For production deployment, run: `vercel --prod`

### Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository (or drag & drop the project folder)
4. Vercel will auto-detect settings
5. Click "Deploy"

## Option 2: Deploy to Netlify

Netlify is another excellent option for static site hosting.

### Steps:

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy from the project directory**:
   ```bash
   cd "e:/Dicrete Website Folder/Submission_Package/react_app"
   netlify deploy
   ```

3. **For production deployment**:
   ```bash
   netlify deploy --prod
   ```

### Alternative: Deploy via Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist` folder into the deployment area
3. Your site will be live instantly!

## Option 3: Deploy to GitHub Pages

If you want to host on GitHub Pages:

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:
   ```json
   {
     "homepage": "https://yourusername.github.io/your-repo-name",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

## Option 4: Manual Deployment to Any Static Host

You can deploy the `dist` folder to any static hosting service:

- **AWS S3 + CloudFront**
- **Google Cloud Storage**
- **Azure Static Web Apps**
- **Firebase Hosting**
- **Surge.sh**

Simply upload the contents of the `dist` folder to your hosting provider.

## Important Notes

### Backend Integration

If you're using the Flask backend (`server.py`), you'll need to:

1. Deploy the backend separately (e.g., on Heroku, Railway, or Render)
2. Update the API endpoint in `App.tsx`:
   ```typescript
   const response = await fetch('YOUR_BACKEND_URL/api/data/graphs', { signal: controller.signal });
   ```

### Environment Variables

If you need to configure different API endpoints for development vs production:

1. Create a `.env` file:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

2. Use in code:
   ```typescript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

## Quick Deploy (Recommended for First Time)

The fastest way to get your site online:

```bash
# Navigate to project
cd "e:/Dicrete Website Folder/Submission_Package/react_app"

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts and you're done!
```

Your application will be live at a URL like: `https://pakistan-economic-observatory.vercel.app`

## Troubleshooting

### Build fails on deployment platform
- Ensure `package.json` has all dependencies listed
- Check Node.js version compatibility

### 404 errors on routes
- Configure your hosting platform for SPA routing
- For Vercel/Netlify, this is automatic
- For others, add a redirect rule to serve `index.html` for all routes

### API calls fail
- Check CORS settings on your backend
- Verify the API URL is correct
- Ensure the backend is deployed and accessible
