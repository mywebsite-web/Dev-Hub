# Deployment Guide for Render

This guide will help you deploy Dev GPT to Render.

## Quick Start

1. **Push to GitHub**
   - Initialize git if not already done: `git init`
   - Add all files: `git add .`
   - Commit: `git commit -m "Ready for deployment"`
   - Push to GitHub: `git push origin main`

2. **Deploy on Render**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect settings from `render.yaml`

3. **Add Environment Variable**
   - In Render dashboard → Your Service → Environment
   - Add: `HUGGINGFACE_API_TOKEN` = `your_token_here`
   - Click "Save Changes"

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Your app will be live!

## Environment Variables

Required:
- `HUGGINGFACE_API_TOKEN` - Your Hugging Face API token (get from https://huggingface.co/settings/tokens)

Auto-set by Render:
- `PORT` - Automatically set by Render
- `NODE_ENV` - Set to "production"

## Post-Deployment

- Your app will be available at: `https://your-app-name.onrender.com`
- The health check endpoint is: `/api/health`
- Free tier includes:
  - 750 hours/month
  - Automatic SSL
  - Sleeps after 15 minutes of inactivity (free tier)

## Troubleshooting

**Build fails:**
- Check that `package.json` has all dependencies
- Verify `render.yaml` is in the root directory

**App doesn't start:**
- Check environment variables are set
- Verify `HUGGINGFACE_API_TOKEN` is correct
- Check logs in Render dashboard

**API errors:**
- Verify your Hugging Face token is valid
- Check API rate limits

## Updating Your App

1. Make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. Render will automatically redeploy

