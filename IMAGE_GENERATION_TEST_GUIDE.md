# Image Generation Testing Guide 🖼️

This guide will help you test the AI image generation feature in Dev GPT.

## Prerequisites

1. **Hugging Face Account & API Token**
   - Sign up at [https://huggingface.co/join](https://huggingface.co/join) (if you don't have one)
   - Get your API token:
     - Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
     - Click "New token"
     - Name it (e.g., "Dev GPT Image Generation")
     - Select "Read" access (or "Write" if you need to upload models)
     - Copy the token (starts with `hf_...`)

## Setup Steps

### 1. Create/Update `.env` File

Create a `.env` file in the project root (or update existing one) with your Hugging Face API token:

```env
# Required for image generation
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Optional: Customize image model (default: stabilityai/stable-diffusion-xl-base-1.0)
IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0

# Other settings
PORT=3000
DEV_SECRET_KEY=your_secure_secret_key
```

**Important:** Replace `hf_your_token_here` with your actual Hugging Face API token!

### 2. Install Dependencies (if not already done)

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

You should see output like:
```
🚀 Dev GPT server is running on port 3000
🖼️  Image Generation: Configured
   • Model: stabilityai/stable-diffusion-xl-base-1.0
```

If you see "Image Generation: Not configured", check that your `.env` file has the `HUGGINGFACE_API_TOKEN` set correctly.

## Testing Image Generation

### Step 1: Open the Application

1. Open your browser and go to: [http://localhost:3000](http://localhost:3000)

### Step 2: Select Image Generation Mode

1. Look for the **Mode** selector above the input box
2. Click the dropdown and select **"🖼️ Image Generation"**

### Step 3: Enter a Prompt

1. Type a descriptive prompt in the input box, for example:
   - `A beautiful sunset over mountains`
   - `A cute cat playing with a ball of yarn`
   - `Futuristic cityscape at night with neon lights`
   - `Abstract art with vibrant colors`
   
2. Press **Enter** or click the **Send** button

### Step 4: Wait for Generation

1. You'll see a typing indicator: "Generating image..."
2. The status will show: "Generating image..."
3. **First generation may take 30-60 seconds** (model needs to load)
4. Subsequent generations are usually faster (10-30 seconds)

### Step 5: View the Result

- The generated image will appear in the chat
- Your prompt will be preserved above the image
- Images are saved to chat history

## Testing in Full-Screen Mode

1. Click the **"⛶ Full Screen"** button in the header
2. Select **Image Generation** mode
3. Enter your prompt
4. Generated images will display beautifully in full-screen mode
5. Click **"✕ Exit Full Screen"** (top-right) to return to normal view

## Example Prompts to Try

### Nature & Landscapes
- `Majestic waterfall in a tropical rainforest`
- `Snowy mountain peak at sunrise`
- `Colorful coral reef underwater`

### Animals
- `Golden retriever puppy in a field of flowers`
- `Eagle soaring over mountains`
- `Underwater scene with dolphins`

### Art & Abstract
- `Abstract painting with geometric shapes`
- `Vintage steampunk city`
- `Minimalist design with pastel colors`

### Sci-Fi & Fantasy
- `Futuristic space station orbiting Earth`
- `Dragon flying over medieval castle`
- `Alien landscape with two moons`

## Troubleshooting

### Error: "Image generation is not configured"
**Solution:** Make sure your `.env` file has `HUGGINGFACE_API_TOKEN` set and you've restarted the server.

### Error: "The model is currently loading. Please wait a moment and try again!"
**Solution:** This is normal for the first request. Wait 30-60 seconds and try again. The model will stay loaded for subsequent requests.

### Error: "Too many requests"
**Solution:** You've hit the rate limit. Wait a few minutes and try again. Free Hugging Face accounts have rate limits.

### Error: "API authentication failed"
**Solution:** Check that your API token is correct in the `.env` file. Make sure it starts with `hf_` and has no extra spaces.

### Image Generation is Slow
**Solution:** 
- First generation is always slow (model loading)
- Subsequent generations are faster
- Free Hugging Face accounts may have slower processing
- Try simpler prompts for faster results

### No Image Appears / Loading Forever
**Solution:**
- Check browser console for errors (F12 → Console)
- Check server logs for error messages
- Verify your API token is valid
- Try a simpler prompt

## Advanced Testing

### Test Multiple Generations
1. Generate several images in the same chat
2. Each image is saved to chat history
3. Images persist when you reload the page

### Test Error Handling
1. Temporarily remove/invalidate the API token in `.env`
2. Restart server and try generating
3. You should see a helpful error message

### Test Different Models
You can change the model in `.env`:
```env
IMAGE_MODEL=stabilityai/stable-diffusion-2-1
# or
IMAGE_MODEL=runwayml/stable-diffusion-v1-5
```

## Checking Server Logs

Watch the server console for helpful information:
- Successful generations: No errors
- Model loading: "503" errors initially (normal)
- Authentication issues: "401" or "403" errors
- Rate limits: "429" errors

## Success Indicators

✅ **Working correctly when:**
- Status shows "Generating image..." then "Image generated successfully!"
- Image appears in chat with proper styling
- No error messages in chat
- Images are saved to chat history

## Need Help?

- Check server console for detailed error messages
- Verify your `.env` file is in the project root
- Make sure you've restarted the server after changing `.env`
- Test your API token at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

Happy image generating! 🎨✨
