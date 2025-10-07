/**
 * BigOlogy - Content Script
 * 
 * This script runs on LeetCode pages and monitors for code submissions.
 * When a submission is detected, it extracts the code and triggers
 * complexity analysis via the background script.
 * 
 * @author Adithya
 * @see https://adithyapaib.com
 */

console.log('BigOlogy - Content Script Loaded');

let lastSubmittedCode = null;
let complexityDisplayed = false;
let isAnalyzing = false;

/**
 * Check if extension context is valid
 * @returns {boolean} True if extension context is valid
 */
function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

/**
 * Extracts the submitted code from Monaco Editor
 * @returns {string|null} The code content or null if not found
 */
function getSubmittedCode() {
  // Try to find the code editor (Monaco Editor used by LeetCode)
  const editorElements = document.querySelectorAll('.view-lines');
  if (editorElements.length > 0) {
    const lines = Array.from(editorElements[0].querySelectorAll('.view-line'))
      .map(line => line.textContent)
      .join('\n');
    return lines;
  }
  return null;
}

/**
 * Gets the currently selected programming language
 * @returns {string} The programming language name
 */
function getProgrammingLanguage() {
  const langButton = document.querySelector('[id^="headlessui-listbox-button"]');
  if (langButton) {
    return langButton.textContent.trim();
  }
  return 'Unknown';
}

/**
 * Classifies complexity into performance categories
 * @param {string} complexity - Complexity in Big O notation
 * @returns {string} Classification class name
 */
function classifyComplexity(complexity) {
  const normalized = complexity.toLowerCase().replace(/\s/g, '');
  
  // Excellent: O(1), O(log log n)
  if (normalized.includes('o(1)') || normalized.includes('o(loglogn)')) {
    return 'excellent';
  }
  
  // Good: O(log n), O(√n)
  if (normalized.includes('o(logn)') || normalized.includes('o(√n)') || 
      normalized.includes('o(sqrtn)')) {
    return 'good';
  }
  
  // Fair: O(n), O(n log n)
  if (normalized.includes('o(nlogn)') || 
      (normalized.includes('o(n)') && !normalized.includes('o(n^') && 
       !normalized.includes('o(n²') && !normalized.includes('o(n2)'))) {
    return 'fair';
  }
  
  // Poor: O(n²), O(n²log n)
  if (normalized.includes('o(n^2)') || normalized.includes('o(n²)') || 
      normalized.includes('o(n2)') || normalized.includes('o(n²logn)')) {
    return 'poor';
  }
  
  // Bad: O(2^n), O(n!), O(n³) or worse
  if (normalized.includes('o(2^n)') || normalized.includes('o(n!)') || 
      normalized.includes('o(n^3)') || normalized.includes('o(n³)') ||
      normalized.includes('o(n3)') || normalized.includes('exponential') ||
      normalized.includes('factorial')) {
    return 'bad';
  }
  
  // Default to fair if unrecognized
  return 'fair';
}

/**
 * Displays the complexity analysis results in the LeetCode UI
 * @param {string} timeComplexity - Time complexity in Big O notation
 * @param {string} spaceComplexity - Space complexity in Big O notation
 */
function displayComplexity(timeComplexity, spaceComplexity) {
  // Remove existing complexity display if present
  const existingDisplay = document.getElementById('leetcode-complexity-display');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  // Find the submission result panel
  const resultPanel = document.querySelector('[data-e2e-locator="submission-result"]') ||
                      document.querySelector('.submission-panel') ||
                      document.querySelector('[class*="result"]');

  if (resultPanel) {
    const timeClass = classifyComplexity(timeComplexity);
    const spaceClass = classifyComplexity(spaceComplexity);
    
    const complexityDiv = document.createElement('div');
    complexityDiv.id = 'leetcode-complexity-display';
    complexityDiv.className = 'complexity-analysis-container';
    complexityDiv.innerHTML = `
      <div class="complexity-header">
        <span class="complexity-icon">⚡</span>
        <span class="complexity-title">BigOlogy
        </span>
      </div>
      <div class="complexity-content">
        <div class="complexity-item time-complexity">
          <span class="complexity-value ${timeClass}">${timeComplexity}</span>
          <span class="complexity-label">Time Complexity</span>
        </div>
        <div class="complexity-item space-complexity">
          <span class="complexity-value ${spaceClass}">${spaceComplexity}</span>
          <span class="complexity-label">Space Complexity</span>
        </div>
      </div>
      <div class="complexity-footer">
        <span class="powered-by">Made with ❤️ by <a href="https://adithyapaib.com" target="_blank" rel="noopener noreferrer">Adithya</a></span>
      </div>
    `;

    // Insert at the beginning of the result panel
    resultPanel.insertBefore(complexityDiv, resultPanel.firstChild);
    complexityDisplayed = true;
  }
}

/**
 * Shows a loading spinner while analysis is in progress
 */
function showLoadingState() {
  const existingDisplay = document.getElementById('leetcode-complexity-display');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  const resultPanel = document.querySelector('[data-e2e-locator="submission-result"]') ||
                      document.querySelector('.submission-panel') ||
                      document.querySelector('[class*="result"]');

  if (resultPanel) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'leetcode-complexity-display';
    loadingDiv.className = 'complexity-analysis-container loading';
    loadingDiv.innerHTML = `
      <div class="complexity-header">
        <span class="complexity-icon">⚡</span>
        <span class="complexity-title">Analyzing Complexity...</span>
      </div>
      <div class="complexity-content">
        <div class="loading-spinner"></div>
      </div>
    `;
    resultPanel.insertBefore(loadingDiv, resultPanel.firstChild);
  }
}

/**
 * Displays an error message when analysis fails
 * @param {string} error - Error message to display
 */
function showErrorState(error) {
  const existingDisplay = document.getElementById('leetcode-complexity-display');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  const resultPanel = document.querySelector('[data-e2e-locator="submission-result"]') ||
                      document.querySelector('.submission-panel') ||
                      document.querySelector('[class*="result"]');

  if (resultPanel) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'leetcode-complexity-display';
    errorDiv.className = 'complexity-analysis-container error';
    errorDiv.innerHTML = `
      <div class="complexity-header">
        <span class="complexity-icon">⚠️</span>
        <span class="complexity-title">Analysis Failed</span>
      </div>
      <div class="complexity-content">
        <p class="error-message">${error}</p>
      </div>
    `;
    resultPanel.insertBefore(errorDiv, resultPanel.firstChild);
  }
}

/**
 * Initiates complexity analysis by sending request to background script
 * @param {string} code - The code to analyze
 * @param {string} language - Programming language of the code
 */
async function analyzeComplexity(code, language) {
  // Prevent multiple simultaneous analyses
  if (isAnalyzing) {
    console.log('Analysis already in progress, skipping...');
    return;
  }
  
  try {
    isAnalyzing = true;
    showLoadingState();
    
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated. Please reload the page.');
    }
    
    // Send message to background script to make API call
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeComplexity',
      code: code,
      language: language
    });

    // Check if response is valid
    if (!response) {
      throw new Error('No response from background script. Extension may need to be reloaded.');
    }

    if (response.success) {
      displayComplexity(response.timeComplexity, response.spaceComplexity);
    } else {
      // If background returned structured error info, present more actionable messages
      if (response.status && String(response.status).startsWith('5')) {
        // Server-side error (e.g., 502)
        showErrorState(`Analysis service temporarily unavailable (server ${response.status}). Please try again in a few moments.`);
      } else if (response.error) {
        showErrorState(response.error);
      } else {
        showErrorState('Failed to analyze complexity');
      }
    }
  } catch (error) {
    console.error('Error analyzing complexity:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Extension context invalidated') || 
        error.message.includes('message port closed')) {
      showErrorState('Extension reloaded. Please refresh this page (F5) to continue.');
    } else {
      showErrorState('Connection error. Please try again or refresh the page.');
    }
  } finally {
    isAnalyzing = false;
  }
}

/**
 * DOM observer to detect when submission results appear
 * Automatically triggers analysis when results panel is shown
 */
const observer = new MutationObserver((mutations) => {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.warn('Extension context invalidated, stopping observer');
    observer.disconnect();
    return;
  }
  
  // Check if submission result panel appears
  const resultPanel = document.querySelector('[data-e2e-locator="submission-result"]') ||
                      document.querySelector('.submission-panel') ||
                      document.querySelector('[class*="result"]');
  
  // If result panel exists and we haven't analyzed yet
  if (resultPanel && !complexityDisplayed && !isAnalyzing) {
    const code = getSubmittedCode();
    if (code && code.length > 0) {
      // Only analyze if code is different or this is first submission
      if (code !== lastSubmittedCode) {
        lastSubmittedCode = code;
        const language = getProgrammingLanguage();
        console.log('New submission detected, analyzing complexity...');
        console.log('Code length:', code.length, 'Language:', language);
        analyzeComplexity(code, language);
        complexityDisplayed = true;
      }
    }
  }
  
  // Reset flag when result panel is removed (when navigating away or closing)
  if (!resultPanel && complexityDisplayed) {
    console.log('Result panel removed, resetting display flag');
    complexityDisplayed = false;
    lastSubmittedCode = null;
  }
});

// Start observing DOM for changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

/**
 * Event listener for submit button clicks
 * Resets the display flag when new submission is made
 */
document.addEventListener('click', (e) => {
  const target = e.target;
  
  // Check if submit button is clicked
  if (target.matches('[data-e2e-locator="console-submit-button"]') ||
      target.closest('[data-e2e-locator="console-submit-button"]') ||
      (target.tagName === 'BUTTON' && target.textContent.includes('Submit'))) {
    
    // Remove existing complexity display
    const existingDisplay = document.getElementById('leetcode-complexity-display');
    if (existingDisplay) {
      existingDisplay.remove();
    }
    
    // Reset state for new submission
    complexityDisplayed = false;
    lastSubmittedCode = null;
    isAnalyzing = false;
    console.log('Submit button clicked, ready to analyze next submission');
  }
}, true);

console.log('BigOlogy - Ready to monitor submissions');
