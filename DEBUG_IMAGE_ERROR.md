# Debugging Image Generation Error

You're getting: "Sorry, I encountered an error generating the image. Image generation failed"

## Quick Diagnostic Steps

### 1. Check Server Console Logs

When you try to generate an image, look at your **server console** (where you ran `npm start`). You should see detailed error messages like:

```
Hugging Face Image API Error:
  Status: 401
  Message: Request failed with status code 401
  Response: {"error":"..."}
```

**Share what you see in the server console** - this will help identify the exact issue.

### 2. Common Issues & Solutions

#### Issue: "API authentication failed"
**Symptoms:** Status 401 or 403 in console
**Solution:**
- Check your `.env` file has: `HUGGINGFACE_API_TOKEN=hf_your_token_here`
- Make sure token starts with `hf_`
- Verify token at https://huggingface.co/settings/tokens
- Restart server after changing `.env`

#### Issue: "Model is currently loading"
**Symptoms:** Status 503 in console
**Solution:**
- Wait 30-60 seconds
- This happens on first request
- Try again after waiting

#### Issue: "Model not found"
**Symptoms:** Status 404 in console
**Solution:**
- Check model name in `.env`: `IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0`
- Try a different model like: `IMAGE_MODEL=runwayml/stable-diffusion-v1-5`

#### Issue: "Too many requests"
**Symptoms:** Status 429 in console
**Solution:**
- Wait 5-10 minutes
- Free Hugging Face accounts have rate limits

#### Issue: "Timeout"
**Symptoms:** Request takes too long
**Solution:**
- Try a simpler/shorter prompt
- The model might be overloaded

### 3. Test Your API Token

Run this command in your terminal to test if your token works:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0
```

Replace `YOUR_TOKEN_HERE` with your actual token. You should see model information, not an error.

### 4. Check .env File Location

Make sure your `.env` file is in the **project root** (same folder as `server.js`):

```
Dev GPT/
├── .env          ← Should be here
├── server.js
├── package.json
└── public/
```

### 5. Verify Environment Variables Are Loaded

After starting the server, you should see:

```
🖼️  Image Generation: Configured
   • Model: stabilityai/stable-diffusion-xl-base-1.0
   • API Endpoint: https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0
   • Token: hf_xxxxxx...
```

If you see "Not configured", your `.env` file isn't being read.

### 6. Try Alternative Model

If the default model doesn't work, try adding to `.env`:

```env
IMAGE_MODEL=runwayml/stable-diffusion-v1-5
```

Then restart the server.

## Next Steps

1. **Check server console** when you try to generate an image
2. **Copy the error message** you see
3. **Check your `.env` file** has the token set correctly
4. **Share the console output** so we can identify the exact issue

The improved error handling should now show more specific error messages. Try generating an image again and check both:
- The **browser console** (F12 → Console tab)
- The **server console** (terminal where you ran npm start)
