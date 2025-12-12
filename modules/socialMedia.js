const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { TwitterApi } = require('twitter-api-v2');
const snoowrap = require('snoowrap');

const socialMediaLogs = [];

// Initialize social media clients
let twitterClient = null;
let redditClient = null;

// Twitter/X Configuration
function initializeTwitter() {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.warn('⚠️ Twitter credentials not configured. Twitter features will be limited.');
    return null;
  }

  try {
    twitterClient = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    if (bearerToken) {
      twitterClient.bearerToken = bearerToken;
    }

    console.log('✅ Twitter client initialized');
    return twitterClient;
  } catch (error) {
    console.error('❌ Twitter initialization error:', error);
    return null;
  }
}

// Twitter/X: Post status
async function postToTwitter(text, devKey) {
  try {
    if (!twitterClient) {
      initializeTwitter();
    }

    if (!twitterClient) {
      return {
        success: false,
        message: '❌ Twitter not configured. Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET in .env'
      };
    }

    const tweet = await twitterClient.v2.tweet(text);
    
    logSocialMediaAction('twitter', 'post', text, tweet.data.id, 'success', devKey);

    return {
      success: true,
      message: `✅ Tweet posted successfully!\n\nTweet ID: ${tweet.data.id}\nText: ${text}`,
      tweetId: tweet.data.id
    };
  } catch (error) {
    console.error('Twitter post error:', error);
    logSocialMediaAction('twitter', 'post', text, null, 'failed', devKey, error.message);
    
    let errorMessage = `❌ Failed to post tweet: ${error.message || 'Unknown error'}`;
    
    // Provide helpful error messages for common issues
    if (error.code === 403 || error.message.includes('403')) {
      errorMessage += '\n\n🔧 Troubleshooting 403 Error:\n';
      errorMessage += '1. Check if your Twitter app has WRITE permissions enabled\n';
      errorMessage += '2. Verify your Access Token has "tweet.write" scope\n';
      errorMessage += '3. Go to https://developer.twitter.com/en/portal/dashboard\n';
      errorMessage += '4. Check your app\'s "User authentication settings"\n';
      errorMessage += '5. Ensure "Read and write" or "Read and write and Direct message" is selected\n';
      errorMessage += '6. Regenerate your Access Token after changing permissions\n';
      errorMessage += '7. Make sure you\'re using Twitter API v2 (not v1.1)';
    } else if (error.code === 401 || error.message.includes('401')) {
      errorMessage += '\n\n🔧 Authentication Error:\n';
      errorMessage += '1. Verify your API keys and tokens are correct\n';
      errorMessage += '2. Check if tokens have expired\n';
      errorMessage += '3. Regenerate tokens if needed';
    } else if (error.code === 429 || error.message.includes('429')) {
      errorMessage += '\n\n🔧 Rate Limit Error:\n';
      errorMessage += 'You\'ve exceeded Twitter\'s rate limit. Please wait before posting again.';
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}

// Twitter/X: Search
async function searchTwitter(query, devKey) {
  try {
    if (!twitterClient) {
      initializeTwitter();
    }

    if (!twitterClient) {
      return {
        success: false,
        message: '❌ Twitter not configured. Please set Twitter credentials in .env'
      };
    }

    const searchResults = await twitterClient.v2.search(query, {
      max_results: 10
    });

    logSocialMediaAction('twitter', 'search', query, null, 'success', devKey);

    const tweets = searchResults.data.data || [];
    const tweetsList = tweets.map(tweet => 
      `• @${tweet.author_id}: ${tweet.text.substring(0, 100)}...`
    ).join('\n');

    return {
      success: true,
      message: `🔍 Twitter Search Results for "${query}":\n\n${tweetsList || 'No results found'}`,
      results: tweets
    };
  } catch (error) {
    console.error('Twitter search error:', error);
    logSocialMediaAction('twitter', 'search', query, null, 'failed', devKey, error.message);
    
    return {
      success: false,
      message: `❌ Failed to search Twitter: ${error.message || 'Unknown error'}`
    };
  }
}

// Instagram: Post (using Graph API)
async function postToInstagram(text, imagePath, devKey) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const pageId = process.env.INSTAGRAM_PAGE_ID;

    if (!accessToken || !pageId) {
      return {
        success: false,
        message: '❌ Instagram not configured. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_PAGE_ID in .env'
      };
    }

    // Instagram Graph API requires image URL (hosted), not local file
    // For local files, you'd need to upload to a hosting service first
    if (imagePath && !imagePath.startsWith('http')) {
      return {
        success: false,
        message: '❌ Instagram requires image URL (http/https). Local file paths are not supported.\n\nUpload image to a hosting service first, then use the URL.'
      };
    }

    // Post to Instagram (simplified - actual implementation requires more steps)
    const response = await axios.post(
      `https://graph.instagram.com/${pageId}/media`,
      {
        caption: text,
        image_url: imagePath || null,
        access_token: accessToken
      }
    );

    logSocialMediaAction('instagram', 'post', text, response.data.id, 'success', devKey);

    return {
      success: true,
      message: `✅ Instagram post created!\n\nPost ID: ${response.data.id}\nText: ${text}`,
      postId: response.data.id
    };
  } catch (error) {
    console.error('Instagram post error:', error);
    logSocialMediaAction('instagram', 'post', text, null, 'failed', devKey, error.message);
    
    return {
      success: false,
      message: `❌ Failed to post to Instagram: ${error.message || 'Unknown error'}`
    };
  }
}

// LinkedIn: Post update
async function postToLinkedIn(text, devKey) {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const personUrn = process.env.LINKEDIN_PERSON_URN;

    if (!accessToken || !personUrn) {
      return {
        success: false,
        message: '❌ LinkedIn not configured. Please set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN in .env'
      };
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    logSocialMediaAction('linkedin', 'post', text, response.data.id, 'success', devKey);

    return {
      success: true,
      message: `✅ LinkedIn post published!\n\nPost ID: ${response.data.id}\nText: ${text}`,
      postId: response.data.id
    };
  } catch (error) {
    console.error('LinkedIn post error:', error);
    logSocialMediaAction('linkedin', 'post', text, null, 'failed', devKey, error.message);
    
    return {
      success: false,
      message: `❌ Failed to post to LinkedIn: ${error.message || 'Unknown error'}`
    };
  }
}

// Reddit: Initialize client
function initializeReddit() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  const userAgent = process.env.REDDIT_USER_AGENT || 'Dev-GPT Bot 1.0';

  if (!clientId || !clientSecret || !username || !password) {
    console.warn('⚠️ Reddit credentials not configured. Reddit features will be limited.');
    return null;
  }

  try {
    redditClient = new snoowrap({
      userAgent: userAgent,
      clientId: clientId,
      clientSecret: clientSecret,
      username: username,
      password: password
    });

    console.log('✅ Reddit client initialized');
    return redditClient;
  } catch (error) {
    console.error('❌ Reddit initialization error:', error);
    return null;
  }
}

// Reddit: Comment
async function commentOnReddit(subreddit, text, devKey) {
  try {
    if (!redditClient) {
      initializeReddit();
    }

    if (!redditClient) {
      return {
        success: false,
        message: '❌ Reddit not configured. Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, and REDDIT_PASSWORD in .env'
      };
    }

    // Get a post from the subreddit to comment on
    const subredditObj = await redditClient.getSubreddit(subreddit);
    const posts = await subredditObj.getHot({ limit: 1 });
    
    if (posts.length === 0) {
      return {
        success: false,
        message: `❌ No posts found in r/${subreddit}`
      };
    }

    const post = posts[0];
    const comment = await post.reply(text);

    logSocialMediaAction('reddit', 'comment', text, comment.id, 'success', devKey);

    return {
      success: true,
      message: `✅ Reddit comment posted!\n\nSubreddit: r/${subreddit}\nPost: ${post.title}\nComment ID: ${comment.id}`,
      commentId: comment.id
    };
  } catch (error) {
    console.error('Reddit comment error:', error);
    logSocialMediaAction('reddit', 'comment', text, null, 'failed', devKey, error.message);
    
    return {
      success: false,
      message: `❌ Failed to post Reddit comment: ${error.message || 'Unknown error'}`
    };
  }
}

// Reddit: Post
async function postToReddit(subreddit, title, text, devKey) {
  try {
    if (!redditClient) {
      initializeReddit();
    }

    if (!redditClient) {
      return {
        success: false,
        message: '❌ Reddit not configured. Please set Reddit credentials in .env'
      };
    }

    const subredditObj = await redditClient.getSubreddit(subreddit);
    const post = await subredditObj.submitSelfpost({
      title: title,
      text: text
    });

    logSocialMediaAction('reddit', 'post', `${title}: ${text}`, post.id, 'success', devKey);

    return {
      success: true,
      message: `✅ Reddit post submitted!\n\nSubreddit: r/${subreddit}\nPost ID: ${post.id}\nTitle: ${title}`,
      postId: post.id
    };
  } catch (error) {
    console.error('Reddit post error:', error);
    logSocialMediaAction('reddit', 'post', `${title}: ${text}`, null, 'failed', devKey, error.message);
    
    return {
      success: false,
      message: `❌ Failed to post to Reddit: ${error.message || 'Unknown error'}`
    };
  }
}

// Facebook: Post
async function postToFacebook(text, devKey) {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      return {
        success: false,
        message: '❌ Facebook not configured. Please set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID in .env'
      };
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        message: text,
        access_token: accessToken
      }
    );

    logSocialMediaAction('facebook', 'post', text, response.data.id, 'success', devKey);

    return {
      success: true,
      message: `✅ Facebook post published!\n\nPost ID: ${response.data.id}\nText: ${text}`,
      postId: response.data.id
    };
  } catch (error) {
    console.error('Facebook post error:', error);
    logSocialMediaAction('facebook', 'post', text, null, 'failed', devKey, error.message);
    
    return {
      success: false,
      message: `❌ Failed to post to Facebook: ${error.message || 'Unknown error'}`
    };
  }
}

// Log social media actions
function logSocialMediaAction(platform, action, content, postId, status, devKey, error = null) {
  const logEntry = {
    timestamp: Date.now(),
    platform: platform,
    action: action,
    content: content,
    postId: postId,
    status: status,
    error: error,
    devKey: devKey ? '***' + devKey.slice(-4) : 'none'
  };

  socialMediaLogs.push(logEntry);
  saveSocialMediaLogs();

  // Keep only last 100 logs
  if (socialMediaLogs.length > 100) {
    socialMediaLogs.shift();
  }
}

// Save logs to file
function saveSocialMediaLogs() {
  try {
    const logsPath = path.join(__dirname, '../data/social_media_logs.json');
    const logsDir = path.dirname(logsPath);
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(logsPath, JSON.stringify(socialMediaLogs, null, 2));
  } catch (error) {
    console.error('Error saving social media logs:', error);
  }
}

// Load logs from file
function loadSocialMediaLogs() {
  try {
    const logsPath = path.join(__dirname, '../data/social_media_logs.json');
    if (fs.existsSync(logsPath)) {
      const data = fs.readFileSync(logsPath, 'utf8');
      const logs = JSON.parse(data);
      socialMediaLogs.push(...logs);
    }
  } catch (error) {
    console.error('Error loading social media logs:', error);
  }
}

// Get logs
function getSocialMediaLogs(limit = 20) {
  return socialMediaLogs.slice(-limit).reverse();
}

// Initialize on module load
loadSocialMediaLogs();

module.exports = {
  initializeTwitter,
  postToTwitter,
  searchTwitter,
  postToInstagram,
  postToLinkedIn,
  initializeReddit,
  commentOnReddit,
  postToReddit,
  postToFacebook,
  getSocialMediaLogs
};

