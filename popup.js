/**
 * Popup Script for LeetCode Documentation Generator
 * Handles UI interactions, data loading, and problem management
 */

// DOM Elements
let problemSetTitleInput;
let studentNameInput;
let saveProblemSetInfoButton;
let captureButton;
let statusMessage;
let problemsList;
let problemCount;
let clearAllButton;
let generateDocButton;
let startNewButton;

// State
let currentProblems = [];
let currentProblemSetInfo = { title: '', submittedBy: '' };

/**
 * Listen for auto-extracted data from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTO_EXTRACTED_DATA') {
    console.log('Received auto-extracted data:', message.data);
    handleAutoExtractedData(message.data);
  }
});

/**
 * Handle auto-extracted data from content script
 */
async function handleAutoExtractedData(data) {
  try {
    console.log('Processing auto-extracted data...');
    showStatus('Auto-extracting data...', 'success');
    
    // Validate captured data
    const validation = validateProblemData(data);
    if (!validation.valid) {
      showStatus(`Validation error: ${validation.error}`, 'error');
      return;
    }
    console.log('✓ Data validation passed');
    
    // Add problem to storage
    await addProblem(data);
    console.log('✓ Problem saved to storage');
    
    // Reload problems list
    await loadProblems();
    console.log('✓ Problems list reloaded');
    
    showStatus(`Auto-captured: ${data.name}`, 'success');
  } catch (error) {
    console.error('Error handling auto-extracted data:', error);
    showStatus('Error processing auto-extracted data', 'error');
  }
}

/**
 * Initialize popup when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup initialized');
  
  // Get DOM elements
  problemSetTitleInput = document.getElementById('problemSetTitle');
  studentNameInput = document.getElementById('studentName');
  saveProblemSetInfoButton = document.getElementById('saveProblemSetInfo');
  captureButton = document.getElementById('captureButton');
  statusMessage = document.getElementById('statusMessage');
  problemsList = document.getElementById('problemsList');
  problemCount = document.getElementById('problemCount');
  clearAllButton = document.getElementById('clearAllButton');
  generateDocButton = document.getElementById('generateDocButton');
  startNewButton = document.getElementById('startNewButton');
  
  // Debug: Check if elements were found
  console.log('DOM Elements:', {
    problemSetTitleInput: !!problemSetTitleInput,
    studentNameInput: !!studentNameInput,
    saveProblemSetInfoButton: !!saveProblemSetInfoButton,
    captureButton: !!captureButton,
    statusMessage: !!statusMessage,
    problemsList: !!problemsList,
    problemCount: !!problemCount,
    clearAllButton: !!clearAllButton,
    generateDocButton: !!generateDocButton,
    startNewButton: !!startNewButton
  });
  
  // Set up event listeners
  if (saveProblemSetInfoButton) {
    saveProblemSetInfoButton.addEventListener('click', handleSaveProblemSetInfo);
    console.log('Save button listener added');
  }
  if (captureButton) {
    captureButton.addEventListener('click', handleCaptureFromCurrentPage);
    console.log('Capture button listener added');
  }
  if (clearAllButton) {
    clearAllButton.addEventListener('click', handleClearAll);
    console.log('Clear all button listener added');
  }
  if (generateDocButton) {
    generateDocButton.addEventListener('click', handleGenerateDocument);
    console.log('Generate doc button listener added');
  }
  if (startNewButton) {
    startNewButton.addEventListener('click', handleStartNewProblemSet);
    console.log('Start new button listener added');
  }
  
  // Load data from storage
  await loadProblemSetInfo();
  await loadProblems();
  
  // Auto-trigger capture when popup opens (for keyboard shortcut)
  // Small delay to ensure popup is fully loaded
  setTimeout(() => {
    if (captureButton && !captureButton.disabled) {
      console.log('Auto-triggering capture after popup load');
      captureButton.click();
    }
  }, 200);
  
  console.log('Popup initialization complete');
});

/**
 * Load problem set info from storage and populate form
 */
async function loadProblemSetInfo() {
  try {
    currentProblemSetInfo = await getProblemSetInfo();
    
    // Handle edge case where info might be null or undefined
    if (!currentProblemSetInfo) {
      currentProblemSetInfo = { title: '', submittedBy: '' };
    }
    
    problemSetTitleInput.value = currentProblemSetInfo.title || '';
    studentNameInput.value = currentProblemSetInfo.submittedBy || '';
  } catch (error) {
    console.error('Error loading problem set info:', error);
    showStatus('Error loading problem set info. Please refresh the extension.', 'error');
    // Set defaults so the extension can still function
    currentProblemSetInfo = { title: '', submittedBy: '' };
  }
}

/**
 * Load problems from storage and display them
 */
async function loadProblems() {
  try {
    currentProblems = await getAllProblems();
    
    // Handle edge case where problems might be null or undefined
    if (!Array.isArray(currentProblems)) {
      console.warn('Problems data is not an array, resetting to empty array');
      currentProblems = [];
    }
    
    displayProblems();
  } catch (error) {
    console.error('Error loading problems:', error);
    showStatus('Error loading problems. Please refresh the extension.', 'error');
    // Set defaults so the extension can still function
    currentProblems = [];
    displayProblems();
  }
}

/**
 * Display problems list in the UI
 */
function displayProblems() {
  console.log('displayProblems called with', currentProblems.length, 'problems');
  
  // Update problem count
  const count = currentProblems.length;
  problemCount.textContent = `${count} problem${count !== 1 ? 's' : ''}`;
  
  // Show/hide clear all button
  clearAllButton.style.display = count > 0 ? 'block' : 'none';
  
  // Clear current list
  problemsList.innerHTML = '';
  
  // Show empty state if no problems
  if (count === 0) {
    problemsList.innerHTML = '<div class="empty-state">No problems captured yet.<br>Click "Capture from Current Page" on a LeetCode submission page.</div>';
    return;
  }
  
  // Display each problem
  currentProblems.forEach((problem, index) => {
    console.log(`  ${index + 1}. ${problem.name} (${problem.language})`);
    const problemItem = createProblemItem(problem, index);
    problemsList.appendChild(problemItem);
  });
  
  console.log('✓ Problems displayed in UI');
}

/**
 * Create a problem item element
 */
function createProblemItem(problem, index) {
  const item = document.createElement('div');
  item.className = 'problem-card';
  item.draggable = true;
  item.dataset.problemId = problem.id;

  item.innerHTML = `
    <div class="problem-header">
      <div class="problem-title">
        <span class="problem-index">${index + 1}.</span>
        <span class="problem-name">${escapeHtml(problem.name)}</span>
      </div>

      <div class="problem-actions">
        <i class="fas fa-pen edit-icon" title="Edit"></i>
        <i class="fas fa-trash delete-icon" title="Delete"></i>
      </div>
    </div>

    <div class="problem-meta">
      <span class="language-badge">${escapeHtml(problem.language)}</span>
    </div>
  `;

  // Icon listeners
  item.querySelector('.edit-icon')
      .addEventListener('click', () => handleEditProblem(problem.id));

  item.querySelector('.delete-icon')
      .addEventListener('click', () => handleDeleteProblem(problem.id));

  // Drag & drop (keep existing logic)
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('drop', handleDrop);
  item.addEventListener('dragend', handleDragEnd);

  return item;
}

/**
 * Validate problem set info fields
 * @param {string} title - Problem set title
 * @param {string} submittedBy - Student name
 * @returns {Object} {valid: boolean, error: string|null}
 */
function validateProblemSetInfo(title, submittedBy) {
  // Check if fields are empty
  if (!title || !submittedBy) {
    return { valid: false, error: 'Please fill in both Problem Set Title and Student Name' };
  }
  
  // Check minimum length
  if (title.length < 2) {
    return { valid: false, error: 'Problem Set Title must be at least 2 characters long' };
  }
  
  if (submittedBy.length < 2) {
    return { valid: false, error: 'Student Name must be at least 2 characters long' };
  }
  
  // Check maximum length
  if (title.length > 200) {
    return { valid: false, error: 'Problem Set Title is too long (maximum 200 characters)' };
  }
  
  if (submittedBy.length > 100) {
    return { valid: false, error: 'Student Name is too long (maximum 100 characters)' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate captured problem data before saving
 * @param {Object} problemData - Problem data {name, submissionLink, code, language}
 * @returns {Object} {valid: boolean, error: string|null}
 */
function validateProblemData(problemData) {
  // Check if required fields exist
  if (!problemData) {
    return { valid: false, error: 'No problem data provided' };
  }
  
  // Validate problem name
  if (!problemData.name || typeof problemData.name !== 'string' || problemData.name.trim().length === 0) {
    return { valid: false, error: 'Problem name is required and cannot be empty' };
  }
  
  if (problemData.name.length > 300) {
    return { valid: false, error: 'Problem name is too long (maximum 300 characters)' };
  }
  
  // Validate submission link
  if (!problemData.submissionLink || typeof problemData.submissionLink !== 'string' || problemData.submissionLink.trim().length === 0) {
    return { valid: false, error: 'Submission link is required and cannot be empty' };
  }
  
  // Check if submission link is a valid URL
  try {
    const url = new URL(problemData.submissionLink);
    if (!url.hostname.includes('leetcode.com')) {
      return { valid: false, error: 'Submission link must be from leetcode.com' };
    }
  } catch (e) {
    return { valid: false, error: 'Submission link is not a valid URL' };
  }
  
  // Validate code
  if (!problemData.code || typeof problemData.code !== 'string' || problemData.code.trim().length === 0) {
    return { valid: false, error: 'Code is required and cannot be empty' };
  }
  
  if (problemData.code.length > 100000) {
    return { valid: false, error: 'Code is too long (maximum 100,000 characters)' };
  }
  
  // Validate language
  if (!problemData.language || typeof problemData.language !== 'string' || problemData.language.trim().length === 0) {
    return { valid: false, error: 'Programming language is required and cannot be empty' };
  }
  
  return { valid: true, error: null };
}

/**
 * Handle save problem set info button click
 */
async function handleSaveProblemSetInfo() {
  const title = problemSetTitleInput.value.trim();
  const submittedBy = studentNameInput.value.trim();
  
  // Validate input
  const validation = validateProblemSetInfo(title, submittedBy);
  if (!validation.valid) {
    showStatus(validation.error, 'error');
    return;
  }
  
  try {
    await saveProblemSetInfo({ title, submittedBy });
    currentProblemSetInfo = { title, submittedBy };
    showStatus('Problem set info saved!', 'success');
  } catch (error) {
    console.error('Error saving problem set info:', error);
    
    // Provide specific error message
    let errorMessage = 'Error saving problem set info';
    if (error.message.includes('Invalid')) {
      errorMessage = error.message;
    } else if (error.message.includes('storage')) {
      errorMessage = 'Storage error. Please check your browser storage settings.';
    } else {
      errorMessage = `Error saving: ${error.message}`;
    }
    
    showStatus(errorMessage, 'error');
  }
}

/**
 * Check if content script is ready by sending a ping
 */
async function checkContentScriptReady(tabId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Ping attempt ${attempt}/${maxRetries}`);
      const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      if (response && response.success) {
        console.log('Content script is ready');
        return true;
      }
    } catch (error) {
      console.error(`Ping attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        // Wait before retrying (longer wait for post-refresh checks)
        const waitTime = maxRetries > 3 ? 1000 : 300; // 1s for post-refresh, 300ms for initial
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  return false;
}

/**
 * Show a countdown while the page is refreshing
 */
async function showRefreshCountdown() {
  const countdownDuration = 3; // 3 seconds
  
  for (let i = countdownDuration; i > 0; i--) {
    showStatus(`Page refreshing... ${i}`, 'refreshing');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Send message to content script with retry logic
 */
async function sendMessageToContentScript(tabId, message, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Sending message to content script`);
      const response = await chrome.tabs.sendMessage(tabId, message);
      console.log('Received response:', response);
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Last attempt failed, throw the error
        throw error;
      }
    }
  }
}

/**
 * Handle capture from current page button click
 */
async function handleCaptureFromCurrentPage() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if it's a LeetCode submission page
    if (!tab.url || (!tab.url.includes('leetcode.com/problems/') && !tab.url.includes('leetcode.com/submissions/detail/'))) {
      showStatus('Please navigate to a LeetCode submission page', 'error');
      return;
    }
    
    showStatus('Checking page status...', 'success');
    captureButton.disabled = true;
    captureButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    
    // First, check if content script is ready
    const isContentScriptReady = await checkContentScriptReady(tab.id, 1); // Only 1 attempt initially
    
    if (!isContentScriptReady) {
      console.log('Content script not ready, refreshing page...');
      showStatus('Content script not loaded. Refreshing page...', 'refreshing');
      captureButton.innerHTML = '<i class="fas fa-refresh fa-spin"></i> Refreshing...';
      
      // Refresh the page
      await chrome.tabs.reload(tab.id);
      
      // Show refreshing status with countdown
      await showRefreshCountdown();
      
      // Wait for page to reload and content script to load
      console.log('Waiting for page to reload...');
      showStatus('Page refreshed. Waiting for content script...', 'refreshing');
      captureButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      
      // Check again with more attempts after refresh
      const isReadyAfterRefresh = await checkContentScriptReady(tab.id, 5);
      
      if (!isReadyAfterRefresh) {
        showStatus('Content script still not ready after refresh. Please try again.', 'error');
        return;
      }
      
      console.log('✓ Content script ready after refresh');
      showStatus('Content script loaded. Capturing data...', 'success');
      captureButton.innerHTML = '<i class="fas fa-download fa-spin"></i> Capturing...';
    } else {
      console.log('✓ Content script already ready');
      showStatus('Capturing data...', 'success');
      captureButton.innerHTML = '<i class="fas fa-download fa-spin"></i> Capturing...';
    }
    
    // Now attempt to extract data
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PROBLEM_DATA' });
      
      if (response && response.success) {
        // Check if it's a redirect message (for detail-only URLs)
        if (response.message && response.message.includes('Redirecting')) {
          console.log('✓ Redirecting to proper URL format...');
          showStatus('Redirecting to proper URL...', 'success');
          // Don't process data yet, wait for redirect and auto-extraction
          return;
        }
        
        console.log('✓ Received data from content script');
        console.log('  - Problem name:', response.data.name);
        console.log('  - Language:', response.data.language);
        console.log('  - Code length:', response.data.code?.length);
        console.log('  - Submission link:', response.data.submissionLink);
        
        // Validate captured data before saving
        const validation = validateProblemData(response.data);
        if (!validation.valid) {
          showStatus(`Validation error: ${validation.error}`, 'error');
          return;
        }
        console.log('✓ Data validation passed');
        
        // Add problem to storage (includes code)
        await addProblem(response.data);
        console.log('✓ Problem saved to storage');
        
        // Reload problems list
        await loadProblems();
        console.log('✓ Problems list reloaded');
        console.log('  - Total problems:', currentProblems.length);
        
        showStatus(`Captured: ${response.data.name}`, 'success');
      } else {
        const errorMsg = response?.error || 'Failed to capture problem';
        console.error('✗ Capture failed:', errorMsg);
        showStatus(errorMsg, 'error');
      }
    } catch (messageError) {
      console.error('✗ Message error after refresh:', messageError);
      // Check if we're on a detail-only URL that might be redirecting
      if (tab.url && tab.url.includes('leetcode.com/submissions/detail/')) {
        showStatus('Redirecting to proper URL format...', 'success');
      } else {
        showStatus('Error: Content script still not responding. Please try refreshing manually.', 'error');
      }
    }
  } catch (error) {
    console.error('✗ Error capturing problem:', error);
    showStatus('Error capturing problem.', 'error');
  } finally {
    captureButton.disabled = false;
    captureButton.innerHTML = '<i class="fas fa-camera"></i> Capture from Current Page';
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  statusMessage.className = `status-message ${type}`;
  
  if (type === 'refreshing') {
    // Add spinner for refreshing status
    statusMessage.innerHTML = `<div class="spinner"></div>${message}`;
  } else {
    statusMessage.textContent = message;
  }
  
  statusMessage.style.display = type === 'refreshing' ? 'flex' : 'block';
  
  // Auto-hide after 3 seconds (except for refreshing status)
  if (type !== 'refreshing') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Note: Generate document functionality will be implemented in task 6

/**
 * Handle moving a problem up or down
 */
async function handleMoveProblem(id, direction) {
  try {
    const currentIndex = currentProblems.findIndex(p => p.id === id);
    if (currentIndex === -1) {
      showStatus('Problem not found', 'error');
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (newIndex < 0 || newIndex >= currentProblems.length) {
      // Silently ignore - user tried to move beyond bounds
      return;
    }
    
    // Swap problems in array
    const temp = currentProblems[currentIndex];
    currentProblems[currentIndex] = currentProblems[newIndex];
    currentProblems[newIndex] = temp;
    
    // Get new order of IDs
    const newOrder = currentProblems.map(p => p.id);
    
    // Save to storage
    await reorderProblems(newOrder);
    
    // Reload and display
    await loadProblems();
  } catch (error) {
    console.error('Error moving problem:', error);
    showStatus(`Error reordering problem: ${error.message}`, 'error');
  }
}

/**
 * Handle editing a problem
 */
async function handleEditProblem(id) {
  const problem = currentProblems.find(p => p.id === id);
  if (!problem) {
    showStatus('Problem not found', 'error');
    return;
  }
  
  // Create edit modal/form
  const newName = prompt('Problem Name:', problem.name);
  if (newName === null) return; // User cancelled
  
  const newLink = prompt('Submission Link:', problem.submissionLink);
  if (newLink === null) return;
  
  const newCode = prompt('Code:', problem.code);
  if (newCode === null) return;
  
  const newLanguage = prompt('Language:', problem.language);
  if (newLanguage === null) return;
  
  // Validate edited data
  const updatedData = {
    name: newName.trim(),
    submissionLink: newLink.trim(),
    code: newCode,
    language: newLanguage.trim()
  };
  
  const validation = validateProblemData(updatedData);
  if (!validation.valid) {
    showStatus(`Validation error: ${validation.error}`, 'error');
    return;
  }
  
  try {
    await updateProblem(id, updatedData);
    
    await loadProblems();
    showStatus('Problem updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating problem:', error);
    
    let errorMessage = 'Error updating problem';
    if (error.message.includes('not found')) {
      errorMessage = 'Problem not found. It may have been deleted.';
    } else if (error.message.includes('Invalid')) {
      errorMessage = error.message;
    } else {
      errorMessage = `Error updating: ${error.message}`;
    }
    
    showStatus(errorMessage, 'error');
  }
}

/**
 * Handle deleting a problem
 */
async function handleDeleteProblem(id) {
  const problem = currentProblems.find(p => p.id === id);
  if (!problem) {
    showStatus('Problem not found', 'error');
    return;
  }
  
  if (!confirm(`Delete "${problem.name}"?`)) return;
  
  try {
    console.log('Deleting problem:', problem.name, 'ID:', id);
    await deleteProblem(id);
    console.log('✓ Problem deleted from storage');
    
    await loadProblems();
    const remaining = currentProblems.length;
    console.log('✓ Problems list reloaded, remaining:', remaining);
    
    showStatus(`Deleted. ${remaining} problem${remaining !== 1 ? 's' : ''} remaining`, 'success');
  } catch (error) {
    console.error('✗ Error deleting problem:', error);
    
    let errorMessage = 'Error deleting problem';
    if (error.message.includes('not found')) {
      errorMessage = 'Problem not found. It may have already been deleted.';
    } else {
      errorMessage = `Error deleting: ${error.message}`;
    }
    
    showStatus(errorMessage, 'error');
  }
}

/**
 * Handle clear all button
 */
async function handleClearAll() {
  const totalCount = currentProblems.length;
  if (!confirm(`Delete all ${totalCount} problem${totalCount !== 1 ? 's' : ''}? This cannot be undone.`)) return;
  
  try {
    console.log('Clearing all problems, current count:', totalCount);
    
    // Delete each problem
    for (const problem of currentProblems) {
      await deleteProblem(problem.id);
    }
    
    console.log('✓ All problems deleted from storage');
    
    await loadProblems();
    console.log('✓ Problems list reloaded, count:', currentProblems.length);
    
    showStatus(`All ${totalCount} problem${totalCount !== 1 ? 's' : ''} cleared`, 'success');
  } catch (error) {
    console.error('✗ Error clearing problems:', error);
    showStatus('Error clearing problems', 'error');
  }
}

/**
 * Handle drag start event
 */
let draggedElement = null;
let draggedProblemId = null;

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedProblemId = e.currentTarget.dataset.problemId;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.currentTarget;
  if (target !== draggedElement && target.classList.contains('problem-item')) {
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    
    if (e.clientY < midpoint) {
      target.style.borderTop = '2px solid #4CAF50';
      target.style.borderBottom = '';
    } else {
      target.style.borderBottom = '2px solid #4CAF50';
      target.style.borderTop = '';
    }
  }
  
  return false;
}

/**
 * Handle drop event
 */
async function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const target = e.currentTarget;
  const targetProblemId = target.dataset.problemId;
  
  if (draggedProblemId !== targetProblemId) {
    try {
      // Find indices
      const draggedIndex = currentProblems.findIndex(p => p.id === draggedProblemId);
      const targetIndex = currentProblems.findIndex(p => p.id === targetProblemId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Remove dragged item
      const [draggedProblem] = currentProblems.splice(draggedIndex, 1);
      
      // Determine insert position based on drop location
      const rect = target.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const insertIndex = e.clientY < midpoint ? targetIndex : targetIndex + 1;
      
      // Insert at new position
      currentProblems.splice(insertIndex > draggedIndex ? insertIndex - 1 : insertIndex, 0, draggedProblem);
      
      // Get new order
      const newOrder = currentProblems.map(p => p.id);
      
      // Save to storage
      await reorderProblems(newOrder);
      
      // Reload
      await loadProblems();
    } catch (error) {
      console.error('Error reordering problems:', error);
      showStatus('Error reordering problems', 'error');
    }
  }
  
  return false;
}

/**
 * Handle drag end event
 */
function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  
  // Remove all border highlights
  document.querySelectorAll('.problem-item').forEach(item => {
    item.style.borderTop = '';
    item.style.borderBottom = '';
  });
  
  draggedElement = null;
  draggedProblemId = null;
}

/**
 * Handle start new problem set button
 */
async function handleStartNewProblemSet() {
  const problemCount = currentProblems.length;
  const hasInfo = currentProblemSetInfo.title || currentProblemSetInfo.submittedBy;
  
  // Show confirmation dialog
  const confirmed = confirm(
    'Start a new problem set?\n\n' +
    'This will clear all current problems and problem set information. ' +
    'Make sure you have generated and saved your document first.\n\n' +
    'This action cannot be undone.'
  );
  
  if (!confirmed) return;
  
  try {
    console.log('Starting new problem set...');
    console.log('  - Current problems:', problemCount);
    console.log('  - Has problem set info:', hasInfo);
    
    // Clear all data from storage (problems + problem set info)
    await clearAll();
    console.log('✓ All data cleared from storage');
    
    // Reset state
    currentProblems = [];
    currentProblemSetInfo = { title: '', submittedBy: '' };
    
    // Reset UI
    problemSetTitleInput.value = '';
    studentNameInput.value = '';
    problemsList.innerHTML = '<div class="empty-state">No problems captured yet.<br>Click "Capture from Current Page" on a LeetCode submission page.</div>';
    problemCount.textContent = '0 problems';
    clearAllButton.style.display = 'none';
    
    console.log('✓ UI reset complete');
    
    // Focus on problem set title input
    problemSetTitleInput.focus();
    
    showStatus('Started new problem set - all data cleared', 'success');
  } catch (error) {
    console.error('✗ Error starting new problem set:', error);
    showStatus('Error starting new problem set', 'error');
  }
}

/**
 * Handle generate document button
 */
async function handleGenerateDocument() {
  // Validate that we have problem set info
  if (!currentProblemSetInfo.title || !currentProblemSetInfo.submittedBy) {
    showStatus('Please save problem set information first', 'error');
    // Focus on the first empty field
    if (!currentProblemSetInfo.title) {
      problemSetTitleInput.focus();
    } else {
      studentNameInput.focus();
    }
    return;
  }
  
  // Validate that we have problems
  if (currentProblems.length === 0) {
    showStatus('Please capture at least one problem first', 'error');
    return;
  }
  
  try {
    showStatus('Generating document...', 'success');
    generateDocButton.disabled = true;
    
    // Prepare document data
    const documentData = {
      problemSetInfo: currentProblemSetInfo,
      problems: currentProblems
    };
    
    // Validate that docx library is loaded
    if (typeof window.docx === 'undefined') {
      throw new Error('Document generation library not loaded. Please refresh the extension.');
    }
    
    // Validate that generator functions are available
    if (typeof generateDocxDocument !== 'function') {
      throw new Error('Document generator not available. Please refresh the extension.');
    }
    
    // Generate the document using the global function from docxGenerator.js
    const doc = generateDocxDocument(documentData);
    
    // Convert to blob using Packer from docx library
    const blob = await window.docx.Packer.toBlob(doc);
    
    // Validate blob was created
    if (!blob || blob.size === 0) {
      throw new Error('Generated document is empty. Please try again.');
    }
    
    // Generate filename using the global function from docxGenerator.js
    const filename = generateFilename(currentProblemSetInfo);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Document generated successfully!', 'success');
  } catch (error) {
    console.error('Error generating document:', error);
    
    // Provide specific error messages
    let errorMessage = 'Error generating document';
    if (error.message.includes('library not loaded') || error.message.includes('not available')) {
      errorMessage = error.message;
    } else if (error.message.includes('empty')) {
      errorMessage = error.message;
    } else {
      errorMessage = `Error generating document: ${error.message}`;
    }
    
    showStatus(errorMessage, 'error');
  } finally {
    generateDocButton.disabled = false;
  }
}
