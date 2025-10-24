# API Key Setup Guide

## Overview

The Document Analyzer requires an **Anthropic API Key** to perform AI-powered document analysis. This guide explains how to obtain and configure your API key.

## Getting Your API Key

1. **Visit Anthropic Console**: https://console.anthropic.com/settings/keys
2. **Sign In**: Log in with your Anthropic account (or create one if needed)
3. **Create API Key**: Click "Create Key" and give it a name
4. **Copy the Key**: Copy the key (starts with `sk-ant-`)
5. **Save Securely**: Store it somewhere safe - it won't be shown again!

## Configuring in the Application

### Method 1: Using the UI (Recommended)

When you launch the application:

1. Look for the **API Key Management** section at the top (indigo/purple background)
2. Click the **"Add API Key"** button
3. Paste your API key into the password-masked input field
4. Click **"Save API Key"** or press **Enter**
5. You'll see a confirmation: `✓ API Key configured (•••••••xxxx)`

![API Key Section](https://via.placeholder.com/800x150/e0e7ff/4338ca?text=API+Key+Management+Section)

### Method 2: Using Browser DevTools

Alternatively, you can set it via the browser console:

1. Launch the application
2. Press **Ctrl+Shift+I** (or Cmd+Option+I on Mac)
3. Go to the **Console** tab
4. Run this command:
   ```javascript
   localStorage.setItem('anthropic_api_key', 'sk-ant-your-key-here')
   ```
5. Refresh the page

## Managing Your API Key

### Viewing Status

The API Key section shows:
- ✓ **Configured**: Green checkmark with last 4 characters (e.g., `•••••••a1b2`)
- ⚠️ **Not Configured**: Red warning with "Add API Key" button

### Updating Your Key

1. Click **"Update"** next to your configured key
2. Enter the new API key
3. Click **"Save API Key"**

### Clearing Your Key

1. Click **"Clear"** next to your configured key
2. Your key will be removed from localStorage
3. You'll need to add a new key before performing analysis

## Security & Privacy

### Where is my API key stored?

Your API key is stored in **localStorage** in your browser. This is:
- ✓ **Local to your machine** - never sent to any server except Anthropic
- ✓ **Persistent** - survives browser restarts
- ✓ **Per-browser** - each browser stores its own copy
- ✓ **Secure** - not accessible to other websites

### Where is my API key sent?

Your API key is **ONLY** sent to:
- **Anthropic's API** (`https://api.anthropic.com/v1/messages`)
- For document analysis requests

It is **NEVER** sent to:
- Any other third-party service
- Any analytics or tracking service
- The application developer

### Best Practices

1. **Keep it Secret**: Never share your API key publicly
2. **Rotate Regularly**: Generate new keys periodically
3. **Use Separate Keys**: Create different keys for different apps
4. **Monitor Usage**: Check your Anthropic console for usage
5. **Set Limits**: Configure spending limits in the Anthropic console

## Troubleshooting

### Error: "Anthropic API Key is required for analysis"

**Solution**: You haven't configured your API key yet.
1. Click the "Add API Key" button at the top
2. Enter your API key and save

### Error: "API request failed with status 401"

**Solution**: Your API key is invalid or expired.
1. Check that you copied the complete key (starts with `sk-ant-`)
2. Verify the key is still active in the Anthropic console
3. Generate a new key if needed

### Error: "API request failed with status 429"

**Solution**: You've exceeded your rate limit or quota.
1. Check your usage in the Anthropic console
2. Wait a few minutes and try again
3. Consider upgrading your plan if needed

### API Key Not Saving

**Solution**: Check browser settings
1. Ensure localStorage is enabled in your browser
2. Check if you're in Private/Incognito mode (localStorage may not persist)
3. Try clearing browser cache and cookies
4. Try a different browser

### Lost My API Key

**Solution**: Generate a new one
1. Go to https://console.anthropic.com/settings/keys
2. Delete the old key if you still see it
3. Create a new key
4. Configure it in the application

## API Usage & Costs

### Understanding Costs

The Document Analyzer uses Claude's API, which charges based on:
- **Input tokens**: Text and documents you send
- **Output tokens**: Text Claude generates

### Typical Costs

For a typical analysis:
- **Small PDF (10 pages)**: ~$0.10 - $0.30
- **Large PDF (50 pages)**: ~$0.50 - $1.50
- **Excel Analysis**: ~$0.05 - $0.20
- **With Multiple Images**: Add ~$0.10 per 5 images

### Monitoring Usage

1. Go to: https://console.anthropic.com/settings/billing
2. Check "Usage" tab for current period
3. Set up billing alerts if desired

### Cost Control Tips

1. **Set Budget Limits**: Configure max monthly spend in Anthropic console
2. **Review Before Sending**: Large documents cost more
3. **Optimize Prompts**: Shorter prompts = lower costs
4. **Batch Processing**: Combine multiple small requests
5. **Use Caching**: Claude caches recent prompts (automatic)

## Support

### Need Help?

- **Anthropic Support**: https://support.anthropic.com
- **API Documentation**: https://docs.anthropic.com
- **Community**: https://discord.gg/anthropic

### Application Issues

For issues specific to this Document Analyzer application:
1. Check the troubleshooting sections in README.md
2. Check the BUILD_INSTRUCTIONS.md for build issues
3. Open Developer Console (Ctrl+Shift+I) to see error messages
4. Verify your internet connection for API calls

## Quick Reference

| Action | Steps |
|--------|-------|
| **Add API Key** | Click "Add API Key" → Enter key → Save |
| **Update Key** | Click "Update" → Enter new key → Save |
| **Clear Key** | Click "Clear" → Confirm |
| **Check Status** | Look at API Key section at top of app |
| **Get New Key** | Visit console.anthropic.com/settings/keys |
| **View Usage** | Visit console.anthropic.com/settings/billing |

---

**Remember**: Your API key is like a password. Keep it secure and never share it publicly!
