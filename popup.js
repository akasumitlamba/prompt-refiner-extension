// ============================================
// STATE MANAGEMENT
// ============================================

let state = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  darkMode: false,
  tabs: [],
  activeTabId: null
};

let draggedElement = null;
let draggedIndex = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  initializeEventListeners();
  applyDarkMode();
  render();
});

// ============================================
// STORAGE FUNCTIONS
// ============================================

async function loadState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['promptRefinerState'], (result) => {
      if (result.promptRefinerState) {
        state = result.promptRefinerState;
      } else {
        // Initialize with default tab
        state = {
          apiKey: '',
          model: 'gemini-2.5-flash',
          tabs: [{
            id: generateId(),
            name: 'Tab 1',
            blocks: [{
              id: generateId(),
              heading: '',
              content: ''
            }],
            history: []
          }],
          activeTabId: null
        };
        state.activeTabId = state.tabs[0].id;
      }
      // Ensure model exists in state (for backwards compatibility)
      if (!state.model) {
        state.model = 'gemini-2.5-flash';
      }
      // Ensure darkMode exists
      if (state.darkMode === undefined) {
        state.darkMode = false;
      }

      // Migration: remove preloaded default texts from existing tabs
      let migrated = false;
      state.tabs.forEach(tab => {
        tab.blocks.forEach(block => {
          if (block.content === 'You are a helpful assistant.') {
            block.content = '';
            migrated = true;
          }
          if (block.heading === 'Role' || block.heading === 'Heading') {
            block.heading = '';
            migrated = true;
          }
        });
      });
      if (migrated) {
        chrome.storage.local.set({ promptRefinerState: state }, () => {});
      }
      resolve();
    });
  });
}

async function saveState() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ promptRefinerState: state }, () => {
      resolve();
    });
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getActiveTab() {
  return state.tabs.find(tab => tab.id === state.activeTabId);
}

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('cancelSettings').addEventListener('click', closeSettings);
  
  // Dark Mode
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
  
  // Tabs
  document.getElementById('addTabBtn').addEventListener('click', addTab);
  
  // Blocks
  document.getElementById('addBlockBtn').addEventListener('click', addBlock);
  
  // Generate & History
  document.getElementById('generateBtn').addEventListener('click', generateResponse);
  document.getElementById('generateAgainBtn').addEventListener('click', generateResponse);
  document.getElementById('viewHistoryBtn').addEventListener('click', openHistory);
  document.getElementById('closeHistory').addEventListener('click', closeHistory);
  document.getElementById('closeResponse').addEventListener('click', closeResponse);
  document.getElementById('copyResponse').addEventListener('click', copyResponse);
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function render() {
  renderTabs();
  renderBlocks();
}

function renderTabs() {
  const container = document.getElementById('tabsContainer');
  container.innerHTML = '';
  
  state.tabs.forEach(tab => {
    const tabWrapper = document.createElement('div');
    tabWrapper.className = `tab-wrapper-bordered ${tab.id === state.activeTabId ? 'active' : ''}`;
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab-name';
    tabElement.textContent = tab.name;
    
    tabElement.addEventListener('click', () => switchTab(tab.id));
    tabElement.addEventListener('dblclick', () => renameTab(tab.id));
    
    tabWrapper.appendChild(tabElement);
    
    // Delete button (only show if more than one tab)
    if (state.tabs.length > 1) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'tab-delete-btn';
      deleteBtn.innerHTML = `
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTab(tab.id);
      });
      tabWrapper.appendChild(deleteBtn);
    }
    
    container.appendChild(tabWrapper);
  });
}

function renderBlocks() {
  const container = document.getElementById('blocksContainer');
  const activeTab = getActiveTab();
  
  if (!activeTab) {
    container.innerHTML = '<p class="text-gray-500">No active tab</p>';
    return;
  }
  
  container.innerHTML = '';
  
  activeTab.blocks.forEach((block, index) => {
    const blockElement = createBlockElement(block, index);
    container.appendChild(blockElement);
  });
}

function createBlockElement(block, index) {
  const div = document.createElement('div');
  div.className = 'block-item bg-white rounded-lg shadow-sm border border-gray-200 p-4';
  div.draggable = true;
  div.dataset.blockId = block.id;
  div.dataset.index = index;
  
  // Drag events
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragover', handleDragOver);
  div.addEventListener('drop', handleDrop);
  div.addEventListener('dragend', handleDragEnd);
  div.addEventListener('dragleave', handleDragLeave);
  
  div.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2 flex-1">
        <svg class="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
        </svg>
        <input type="text" value="${escapeHtml(block.heading)}" 
               class="heading-input font-medium text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 flex-1"
               placeholder="Heading">
      </div>
      <button class="delete-btn p-1.5 text-red-500 hover:bg-red-100 rounded transition" title="Delete block">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div class="relative">
      <textarea class="content-textarea w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="Enter your content here...">${escapeHtml(block.content)}</textarea>
    </div>
  `;
  
  // Event listeners for inputs
  const headingInput = div.querySelector('.heading-input');
  const contentTextarea = div.querySelector('.content-textarea');
  const deleteBtn = div.querySelector('.delete-btn');
  
  headingInput.addEventListener('input', (e) => updateBlock(block.id, 'heading', e.target.value));
  contentTextarea.addEventListener('input', (e) => {
    updateBlock(block.id, 'content', e.target.value);
    autoResizeTextarea(e.target);
  });
  deleteBtn.addEventListener('click', () => deleteBlock(block.id));
  
  // Auto-resize textarea on render
  setTimeout(() => autoResizeTextarea(contentTextarea), 0);
  
  return div;
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// DRAG AND DROP HANDLERS
// ============================================

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.currentTarget;
  if (target !== draggedElement) {
    target.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  if (draggedElement === e.currentTarget) return;
  
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  const activeTab = getActiveTab();
  
  // Reorder blocks
  const blocks = [...activeTab.blocks];
  const [draggedBlock] = blocks.splice(draggedIndex, 1);
  blocks.splice(targetIndex, 0, draggedBlock);
  
  activeTab.blocks = blocks;
  saveState();
  renderBlocks();
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.block-item').forEach(el => el.classList.remove('drag-over'));
  draggedElement = null;
  draggedIndex = null;
}

// ============================================
// TAB MANAGEMENT
// ============================================

function addTab() {
  const tabNumber = state.tabs.length + 1;
  const newTab = {
    id: generateId(),
    name: `Tab ${tabNumber}`,
    blocks: [{
      id: generateId(),
      heading: '',
      content: ''
    }],
    history: []
  };
  
  state.tabs.push(newTab);
  state.activeTabId = newTab.id;
  saveState();
  render();
}

function switchTab(tabId) {
  state.activeTabId = tabId;
  saveState();
  render();
  closeResponse();
}

function renameTab(tabId) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;
  
  const newName = prompt('Enter new tab name:', tab.name);
  if (newName && newName.trim()) {
    tab.name = newName.trim();
    saveState();
    renderTabs();
  }
}

function deleteTab(tabId) {
  if (state.tabs.length === 1) {
    alert('Cannot delete the last tab. At least one tab must remain.');
    return;
  }
  
  const tabIndex = state.tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;
  
  const tab = state.tabs[tabIndex];
  
  // If tab has user data (non-empty heading/content or history), ask confirmation; else delete silently
  const hasUserBlocks = tab.blocks.some(b => (b.heading && b.heading.trim()) || (b.content && b.content.trim()));
  const hasHistory = (tab.history && tab.history.length > 0);
  if (hasUserBlocks || hasHistory) {
    if (!confirm(`Delete tab "${tab.name}"? This will remove all blocks and history.`)) {
      return;
    }
  }
  
  // Remove the tab
  state.tabs.splice(tabIndex, 1);
  
  // If the deleted tab was active, switch to another tab
  if (state.activeTabId === tabId) {
    // Try to activate the next tab, or the previous one if it was the last
    const newActiveIndex = Math.min(tabIndex, state.tabs.length - 1);
    state.activeTabId = state.tabs[newActiveIndex].id;
  }
  
  saveState();
  render();
  closeResponse();
}

// ============================================
// BLOCK MANAGEMENT
// ============================================

function addBlock() {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  
  const newBlock = {
    id: generateId(),
    heading: 'Heading',
    content: ''
  };
  
  activeTab.blocks.push(newBlock);
  saveState();
  renderBlocks();
  
  // Scroll to bottom
  const container = document.getElementById('blocksContainer');
  setTimeout(() => container.scrollTop = container.scrollHeight, 100);
}

function updateBlock(blockId, field, value) {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  
  const block = activeTab.blocks.find(b => b.id === blockId);
  if (block) {
    block[field] = value;
    saveState();
  }
}

function deleteBlock(blockId) {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  
  if (activeTab.blocks.length === 1) {
    alert('Cannot delete the last block. Each tab must have at least one block.');
    return;
  }
  
  activeTab.blocks = activeTab.blocks.filter(b => b.id !== blockId);
  saveState();
  renderBlocks();
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

function openSettings() {
  document.getElementById('apiKeyInput').value = state.apiKey;
  document.getElementById('modelSelect').value = state.model || 'gemini-2.5-flash';
  document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const model = document.getElementById('modelSelect').value;
  state.apiKey = apiKey;
  state.model = model;
  saveState();
  closeSettings();
}

// ============================================
// API INTERACTION
// ============================================

async function generateResponse() {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  
  if (!state.apiKey) {
    alert('Please set your Google Gemini API key in settings first.');
    openSettings();
    return;
  }
  
  // Concatenate all blocks
  const prompt = activeTab.blocks
    .map(block => `${block.heading}:\n${block.content}`)
    .join('\n\n');
  
  if (!prompt.trim()) {
    alert('Please add some content to generate a response.');
    return;
  }
  
  // Show loading state
  const generateBtn = document.getElementById('generateBtn');
  const generateIcon = document.getElementById('generateIcon');
  const loadingIcon = document.getElementById('loadingIcon');
  const generateText = document.getElementById('generateText');
  
  generateBtn.disabled = true;
  generateBtn.classList.add('opacity-75', 'cursor-not-allowed');
  generateIcon.classList.add('hidden');
  loadingIcon.classList.remove('hidden');
  generateText.textContent = 'Generating...';
  document.getElementById('responseArea').classList.add('hidden');
  
  try {
    const selectedModel = state.model || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${state.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    
    // Save to history
    activeTab.history.unshift({
      id: generateId(),
      timestamp: new Date().toISOString(),
      prompt: prompt,
      response: aiResponse
    });
    
    // Keep only last 50 history items
    if (activeTab.history.length > 50) {
      activeTab.history = activeTab.history.slice(0, 50);
    }
    
    await saveState();
    
    // Display response
    displayResponse(aiResponse);
    
  } catch (error) {
    alert(`Error generating response: ${error.message}`);
  } finally {
    // Hide loading state
    generateBtn.disabled = false;
    generateBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    generateIcon.classList.remove('hidden');
    loadingIcon.classList.add('hidden');
    generateText.textContent = 'Generate';
  }
}

function displayResponse(response) {
  const responseText = document.getElementById('responseText');
  responseText.innerHTML = parseMarkdown(response);
  document.getElementById('responseArea').classList.remove('hidden');
}

function parseMarkdown(text) {
  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Parse markdown
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Code blocks: ```code```
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

function closeResponse() {
  document.getElementById('responseArea').classList.add('hidden');
}

function copyResponse() {
  const responseText = document.getElementById('responseText');
  const textContent = responseText.innerText;
  
  navigator.clipboard.writeText(textContent).then(() => {
    // Show feedback
    const copyBtn = document.getElementById('copyResponse');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `;
    copyBtn.classList.add('text-green-600');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.classList.remove('text-green-600');
    }, 2000);
  }).catch(err => {
    alert('Failed to copy response');
  });
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

function openHistory() {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  
  const historyContent = document.getElementById('historyContent');
  
  if (activeTab.history.length === 0) {
    historyContent.innerHTML = '<p class="text-gray-500 text-center py-8">No history yet. Generate some responses to see them here.</p>';
  } else {
    historyContent.innerHTML = activeTab.history.map((item, index) => {
      // Get first line of prompt as preview
      const promptPreview = item.prompt.split('\n')[0].substring(0, 80) + (item.prompt.length > 80 ? '...' : '');
      
      return `
        <div class="history-item border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div class="history-header p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center" data-history-id="${item.id}">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-xs text-gray-500">${formatTimestamp(item.timestamp)}</span>
              </div>
              <div class="text-sm text-gray-700 font-medium truncate">${escapeHtml(promptPreview)}</div>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400 chevron-icon transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <div class="history-content hidden p-4 pt-0 border-t border-gray-100">
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <div class="font-medium text-sm text-gray-700">Prompt:</div>
              </div>
              <div class="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">${escapeHtml(item.prompt)}</div>
            </div>
            <div>
              <div class="flex justify-between items-center mb-2">
                <div class="font-medium text-sm text-gray-700">Response:</div>
                <button class="copy-history-btn text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1" data-response="${escapeHtml(item.response).replace(/"/g, '&quot;')}">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Copy
                </button>
              </div>
              <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 markdown-content">${parseMarkdown(item.response)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers for accordion
    document.querySelectorAll('.history-header').forEach(header => {
      header.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const chevron = this.querySelector('.chevron-icon');
        const isOpen = !content.classList.contains('hidden');
        
        if (isOpen) {
          content.classList.add('hidden');
          chevron.style.transform = 'rotate(0deg)';
        } else {
          content.classList.remove('hidden');
          chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
    
    // Add copy handlers
    document.querySelectorAll('.copy-history-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const responseText = this.getAttribute('data-response');
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = responseText;
        const decodedText = textarea.value;
        
        navigator.clipboard.writeText(decodedText).then(() => {
          const originalHTML = this.innerHTML;
          this.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Copied!
          `;
          this.classList.add('text-green-600');
          
          setTimeout(() => {
            this.innerHTML = originalHTML;
            this.classList.remove('text-green-600');
          }, 2000);
        });
      });
    });
  }
  
  document.getElementById('historyModal').classList.add('active');
}

function closeHistory() {
  document.getElementById('historyModal').classList.remove('active');
}

// ============================================
// DARK MODE
// ============================================

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  saveState();
  applyDarkMode();
}

function applyDarkMode() {
  const darkModeIcon = document.getElementById('darkModeIcon');
  
  if (state.darkMode) {
    document.body.classList.add('dark-mode');
    // Change to sun icon
    darkModeIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
    `;
  } else {
    document.body.classList.remove('dark-mode');
    // Change to moon icon
    darkModeIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
    `;
  }
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

