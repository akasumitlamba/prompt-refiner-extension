# Prompt Refiner - Chrome Extension

A powerful prompt engineering workspace that helps you create, manage, and test reusable prompt templates with Google Gemini AI.

## Features

✨ **API Key Management** - Securely store your Google Gemini API key locally

🎛️ **Model Selection** - Choose between Gemini 2.5 Flash or 2.5 Pro

📑 **Tabbed Interface** - Create multiple tabs for different prompt templates

🧩 **Content Blocks** - Build prompts using reorderable blocks with headings and content

🎯 **Drag & Drop** - Easily reorder blocks by dragging them

🤖 **Gemini AI Integration** - Send prompts to Google Gemini and view responses

📜 **Conversation History** - Track all your prompts and responses per tab

💾 **Local Storage** - All data persists locally in your browser

## Installation

1. **Get a Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key (it's free!)

2. **Install the Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked"
   - Select the folder containing this extension (`AI enhancer`)

3. **Configure API Key & Model**
   - Click the extension icon in your Chrome toolbar
   - Click the settings icon (⚙️) in the top-right
   - Paste your Google Gemini API key
   - Select your preferred model:
     - **Gemini 2.5 Flash** (Fastest, recommended for most use cases)
     - **Gemini 2.5 Pro** (Most capable, for complex tasks)
   - Click "Save"

## Usage

### Creating Tabs
- Click the **+** button to create a new tab
- **Double-click** any tab name to rename it
- Click a tab to switch to it
- Click the **X** button next to a tab to delete it (only shown when you have multiple tabs)
- You must always have at least one tab

### Managing Blocks
- Each block has a **Heading** and **Content** field
- Click **+ Add Block** to add a new block
- Click the **trash icon** to delete a block (minimum 1 block per tab)
- **Drag and drop** blocks using the handle icon (☰) to reorder them
- Content textareas automatically resize as you type

### Generating Responses
1. Fill in your blocks with prompt content
2. Click the **Generate** button
3. Wait for the AI response (loading indicator will show)
4. View the response below the buttons

### Viewing History
- Click the **History** button to view past conversations for the current tab
- History shows prompts and responses with timestamps
- Most recent items appear first
- Up to 50 history items are saved per tab

## File Structure

```
AI enhancer/
├── manifest.json       # Extension configuration
├── popup.html         # Main UI
├── popup.js           # Application logic
├── styles.css         # Custom styling
├── icon16.png         # Extension icon (16x16)
├── icon48.png         # Extension icon (48x48)
├── icon128.png        # Extension icon (128x128)
└── README.md          # This file
```

## Technical Details

- **Manifest Version:** V3
- **Permissions:** `storage`, `https://generativelanguage.googleapis.com/*`
- **Styling:** Custom CSS (CSP-compliant)
- **Storage:** chrome.storage.local (all data persists locally)
- **Supported Models:** 
  - Gemini 2.5 Flash (default)
  - Gemini 2.5 Pro (advanced)

## Tips

- **Model Selection:**
  - Use **Gemini 2.5 Flash** for fast responses and everyday tasks (recommended)
  - Use **Gemini 2.5 Pro** for advanced capabilities and complex reasoning
  - Both models support the same features - choose based on speed vs capability
- Use descriptive headings for your blocks (e.g., "Role", "Context", "Task", "Format")
- Create separate tabs for different use cases (e.g., "Writing Assistant", "Code Review", "Brainstorming")
- The extension stores everything locally - your API key and prompts never leave your browser
- Each tab maintains its own conversation history
- Blocks can be as detailed or simple as you need

## Troubleshooting

**"Please set your Google Gemini API key in settings first"**
- Click the settings icon and enter your API key

**"API Error: 400"**
- Check that your API key is correct
- Ensure you have content in at least one block

**"API Error: 429"**
- You've hit the rate limit - wait a moment and try again

**Extension not loading**
- Make sure all files are in the same folder
- Check that Developer Mode is enabled in chrome://extensions/

## Privacy & Security

- All data is stored locally using Chrome's storage API
- Your API key is stored securely in chrome.storage.local
- No data is sent to any server except Google's Gemini API
- History and prompts remain on your device

## License

Free to use and modify as needed.

---

**Enjoy crafting better prompts!** 🚀

