/**
 * LeetCode Documentation Generator - Background Service Worker
 * Handles message routing between content script and popup
 * Minimal coordinator logic for extension lifecycle management
 */

console.log('LeetCode Doc Generator background service worker loaded');

/**
 * Handle keyboard shortcut commands and action clicks
 */
chrome.action.onClicked.addListener(async (tab) => {
  // This won't fire when there's a popup, but we can detect shortcut usage
  console.log('Action clicked (likely via shortcut)');
});

/**
 * Message router between content script and popup
 * Routes messages based on sender and message type
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from:', sender);
  
  // Determine message source
  const isFromContentScript = sender.tab !== undefined;
  
  // Route messages based on type and source
  if (message.type === 'PROBLEM_DATA_EXTRACTED' && isFromContentScript) {
    // Content script has extracted data
    console.log('Problem data extracted by content script:', message.data);
    
    // Store temporarily in chrome.storage.local for popup to retrieve
    chrome.storage.local.set({
      lastExtractedProblem: message.data,
      lastExtractedTimestamp: Date.now()
    }, () => {
      console.log('Stored extracted problem data');
      sendResponse({ success: true, message: 'Data stored by background' });
    });
    
    return true; // Keep message channel open for async response
  }
  
  // Handle AUTO_EXTRACTED_DATA from keyboard shortcut or redirect
  if (message.type === 'AUTO_EXTRACTED_DATA' && isFromContentScript) {
    console.log('Auto-extracted data from content script:', message.data);
    
    // Import storage helper functions and save the problem
    // We'll notify the user via a simple notification
    chrome.storage.local.get(['problems'], (result) => {
      const problems = result.problems || [];
      
      // Add the new problem
      const newProblem = {
        id: Date.now().toString(),
        ...message.data,
        timestamp: Date.now()
      };
      
      problems.push(newProblem);
      
      chrome.storage.local.set({ problems }, () => {
        console.log('Problem saved via keyboard shortcut');
        sendResponse({ success: true, message: 'Problem saved' });
      });
    });
    
    return true;
  }
  
  // For other message types, allow direct communication
  console.log('Message passed through background script');
  sendResponse({ success: true, message: 'Message acknowledged by background' });
  return true;
});

/**
 * Handle extension installation or update
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('First time installation');
    // Could initialize default storage values here if needed
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

console.log('Background service worker initialized');
