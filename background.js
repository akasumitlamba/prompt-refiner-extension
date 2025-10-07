// Handle extension icon click to toggle sidebar
chrome.action.onClicked.addListener(async (tab) => {
  // Toggle the side panel
  const windowId = tab.windowId;
  
  // Try to open the side panel
  try {
    await chrome.sidePanel.open({ windowId });
  } catch (error) {
    // If it fails, the panel might already be open, so we can't close it programmatically
    // Chrome doesn't provide a way to close the side panel via API yet
    console.log('Side panel toggle:', error);
  }
});

