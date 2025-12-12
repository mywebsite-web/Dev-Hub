# Social Media Integration Setup Guide

This guide explains how to set up and use social media automation features in Dev-GPT.

## ☁️ Cloud Compatibility

**✅ All social media features work on Render and other cloud platforms!**

Unlike WhatsApp (which requires QR code scanning), all social media platforms use API tokens and HTTP requests, making them fully compatible with cloud hosting services like Render, Heroku, etc.

## 📱 Supported Platforms

- **X (Twitter)** - Post tweets and search
- **Instagram** - Post images/text
- **LinkedIn** - Post updates
- **Reddit** - Comment and post
- **Facebook** - Post updates

## 🔧 Setup Instructions

### 1. X (Twitter) Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app and get your API credentials
3. **IMPORTANT - Set App Permissions:**
   - Go to your app's "User authentication settings"
   - Select **"Read and write"** or **"Read and write and Direct message"**
   - This is required for posting tweets (403 error if not set)
4. **Generate Access Token with Write Permissions:**
   - After setting permissions, regenerate your Access Token
   - Make sure it has `tweet.write` scope
5. Add to `.env`:
   ```
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
   TWITTER_BEARER_TOKEN=your_bearer_token (optional)
   ```

**⚠️ Common Issues:**
- **403 Error**: App doesn't have write permissions. Enable "Read and write" in app settings.
- **401 Error**: Invalid or expired tokens. Regenerate your Access Token.
- **429 Error**: Rate limit exceeded. Wait before posting again.

### 2. Instagram Setup

1. Create a Facebook App at [Facebook Developers](https://developers.facebook.com/)
2. Get Instagram Business Account access
3. Generate access token
4. Add to `.env`:
   ```
   INSTAGRAM_ACCESS_TOKEN=your_instagram_token
   INSTAGRAM_PAGE_ID=your_instagram_page_id
   ```

### 3. LinkedIn Setup

1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Get OAuth 2.0 access token
3. Get your Person URN
4. Add to `.env`:
   ```
   LINKEDIN_ACCESS_TOKEN=your_linkedin_token
   LINKEDIN_PERSON_URN=urn:li:person:YOUR_ID
   ```

### 4. Reddit Setup

1. Create an app at [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Get client ID and secret
3. Add to `.env`:
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   REDDIT_USER_AGENT=Dev-GPT Bot 1.0 (optional)
   ```

### 5. Facebook Setup

1. Create an app at [Facebook Developers](https://developers.facebook.com/)
2. Get Page Access Token
3. Get your Page ID
4. Add to `.env`:
   ```
   FACEBOOK_ACCESS_TOKEN=your_page_access_token
   FACEBOOK_PAGE_ID=your_page_id
   ```

## 📋 Available Commands

### X (Twitter)

**Post a tweet:**
```
/x-post "Your tweet text here"
```

**Search Twitter:**
```
/x-search "search query"
```

### Instagram

**Post to Instagram:**
```
/instagram-post "Your caption" https://example.com/image.jpg
```

**Note:** Instagram requires image URLs (hosted), not local file paths.

### LinkedIn

**Post to LinkedIn:**
```
/linkedin-post "Your LinkedIn post text"
```

### Reddit

**Comment on a post:**
```
/reddit-comment "Your comment" subreddit_name
```

**Post to Reddit:**
```
/reddit-post "Post Title" "Post Content" subreddit_name
```

### Facebook

**Post to Facebook:**
```
/facebook-post "Your Facebook post text"
```
or
```
/fb-post "Your Facebook post text"
```

## 🔐 Authentication

All social media commands require:
- **Developer Chat Mode** (say "hi dev" first), OR
- **Secret Key** in the command

## 📊 Logs

View social media action logs:
```
GET /api/dev/social-media/logs?key=SECRET_KEY&limit=20
```

## ⚠️ Important Notes

1. **API Limits**: Each platform has rate limits. Be mindful of how often you post.
2. **Permissions**: Make sure your API tokens have the correct permissions (read, write, etc.)
3. **Privacy**: Never commit your `.env` file with API credentials.
4. **Testing**: Test commands in developer chat mode first before using in production.

## 🚀 Quick Start

1. Install dependencies: `npm install`
2. Configure `.env` with your social media API credentials
3. Start server: `npm start`
4. Activate developer chat: Say "hi dev"
5. Use commands: `/x-post "Hello from Dev-GPT!"`

## 🌐 Render Deployment

### Setting Environment Variables on Render

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add all your social media API credentials:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_TOKEN_SECRET`
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_PAGE_ID`
   - `LINKEDIN_ACCESS_TOKEN`
   - `LINKEDIN_PERSON_URN`
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_USERNAME`
   - `REDDIT_PASSWORD`
   - `FACEBOOK_ACCESS_TOKEN`
   - `FACEBOOK_PAGE_ID`

5. Save and redeploy

### What Works on Render

✅ **All Social Media Features:**
- Twitter/X posting and search
- Instagram posting
- LinkedIn posting
- Reddit comments and posts
- Facebook posting
- Reminders (with console logging)

❌ **What Doesn't Work on Render:**
- WhatsApp (requires QR code scanning - local only)

---

**Note:** Some platforms may require additional setup steps. Refer to each platform's official API documentation for detailed instructions.

