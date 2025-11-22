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

// Icons as inline SVGs
const ICONS = {
  bolt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" /></svg>`,
  cube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57c0 .27.144.518.378.65l8.622 5.03z" /></svg>`
};

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
 * @returns {object} Classification object with class name and score (0-100)
 */
function classifyComplexity(complexity) {
  const normalized = complexity.toLowerCase().replace(/\s/g, '');

  // Excellent: O(1), O(log log n)
  if (normalized.includes('o(1)')) {
    return { class: 'excellent', score: 100, label: 'Excellent', name: 'Constant' };
  }
  if (normalized.includes('o(loglogn)')) {
    return { class: 'excellent', score: 90, label: 'Excellent', name: 'Double Logarithmic' };
  }

  // Good: O(log n), O(√n)
  if (normalized.includes('o(logn)')) {
    return { class: 'good', score: 75, label: 'Good', name: 'Logarithmic' };
  }
  if (normalized.includes('o(√n)') || normalized.includes('o(sqrtn)')) {
    return { class: 'good', score: 65, label: 'Good', name: 'Square Root' };
  }

  // Fair: O(n), O(n log n), O(n*m), O(n+m)
  // Check O(n log n) first to be specific
  if (normalized.includes('o(nlogn)')) {
    return { class: 'fair', score: 25, label: 'Fair', name: 'Linearithmic' };
  }
  // Multi-variable linear/quadratic
  if (normalized.includes('o(n*m)') || normalized.includes('o(m*n)') ||
    normalized.includes('o(nm)') || normalized.includes('o(mn)')) {
    return { class: 'fair', score: 50, label: 'Fair', name: 'Linear' };
  }
  if (normalized.includes('o(n+m)') || normalized.includes('o(m+n)')) {
    return { class: 'fair', score: 50, label: 'Fair', name: 'Linear' };
  }
  if (normalized.includes('o(n)')) {
    return { class: 'fair', score: 50, label: 'Fair', name: 'Linear' };
  }

  // Poor: O(n²), O(n²log n)
  if (normalized.includes('o(n^2)') || normalized.includes('o(n²)') || normalized.includes('o(n2)')) {
    return { class: 'poor', score: 0, label: 'Poor', name: 'Quadratic' };
  }

  // Bad: O(2^n), O(n!), O(n³) or worse
  if (normalized.includes('o(n^3)') || normalized.includes('o(n³)') || normalized.includes('o(n3)')) {
    return { class: 'bad', score: 0, label: 'Bad', name: 'Cubic' };
  }
  if (normalized.includes('o(2^n)') || normalized.includes('exponential')) {
    return { class: 'bad', score: 0, label: 'Bad', name: 'Exponential' };
  }
  if (normalized.includes('o(n!)') || normalized.includes('factorial')) {
    return { class: 'bad', score: 0, label: 'Bad', name: 'Factorial' };
  }

  // Default
  return { class: 'fair', score: 50, label: 'Unknown', name: 'Unknown' };
}

/**
 * Helper to get or create the main container
 * @param {string} type - 'result', 'loading', or 'error'
 * @returns {HTMLElement|null} The container element
 */
function getOrCreateContainer(type) {
  // Remove existing display
  const existingDisplay = document.getElementById('leetcode-complexity-display');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  // Find the submission result element to start from
  const resultElement = document.querySelector('[data-e2e-locator="submission-result"]') ||
    document.querySelector('.submission-panel') ||
    document.querySelector('[class*="result"]');

  if (!resultElement) return null;

  // We need to find the main container that holds both the result info and the buttons (Editorial/Solution)
  // This is usually a few levels up. We look for the container with 'justify-between'.
  let targetContainer = resultElement.closest('.flex.w-full.items-center.justify-between');

  // Fallback: traverse up 3 levels if class search fails (based on observed DOM structure)
  if (!targetContainer && resultElement.parentElement && resultElement.parentElement.parentElement && resultElement.parentElement.parentElement.parentElement) {
    targetContainer = resultElement.parentElement.parentElement.parentElement;
  }

  // If we still can't find the high-level container, fallback to the immediate parent (might look cramped but works)
  const insertionPoint = targetContainer || resultElement.parentElement;

  const container = document.createElement('div');
  container.id = 'leetcode-complexity-display';
  container.className = `complexity-analysis-container ${type}`;

  // Insert at the beginning of the target container
  insertionPoint.insertBefore(container, insertionPoint.firstChild);

  // Force the container to wrap so our full-width element pushes everything else down
  if (insertionPoint.style) {
    insertionPoint.style.flexWrap = 'wrap';
  }

  return container;
}

/**
 * Displays the complexity analysis results in the LeetCode UI
 * @param {string} timeComplexity - Time complexity in Big O notation
 * @param {string} spaceComplexity - Space complexity in Big O notation
 * @param {string} reasoning - Brief explanation of the analysis
 * @param {string} suggestion - Optimization tip
 */
function displayComplexity(timeComplexity, spaceComplexity, reasoning, suggestion) {
  const container = getOrCreateContainer('result');
  if (!container) return;

  const timeData = classifyComplexity(timeComplexity);
  const spaceData = classifyComplexity(spaceComplexity);

  // Calculate position for the graph (0-100%)
  const getGraphPosition = (score) => {
    return 100 - score;
  };

  const timePos = getGraphPosition(timeData.score);

  container.innerHTML = `
    <div class="complexity-row-container">
      <!-- Header Section -->
      <div class="bo-header">
        <div class="bo-title">
          <span>BigOlogy Analysis</span>
        </div>
        <div class="bo-badge">AI Powered</div>
      </div>

      <!-- Main Content Row -->
      <div class="bo-content-row">
        
        <!-- Time Metric -->
        <div class="bo-metric-card">
          <div class="bo-metric-header">
            ${ICONS.clock}
            <span>Time Complexity</span>
          </div>
          <div class="bo-metric-body">
            <span class="bo-value ${timeData.class}">${timeComplexity}</span>
            <span class="bo-label">${timeData.name}</span>
          </div>
        </div>

        <!-- Space Metric -->
        <div class="bo-metric-card">
          <div class="bo-metric-header">
            ${ICONS.cube}
            <span>Space Complexity</span>
          </div>
          <div class="bo-metric-body">
            <span class="bo-value ${spaceData.class}">${spaceComplexity}</span>
            <span class="bo-label">${spaceData.name}</span>
          </div>
        </div>

        <!-- Visual Scale & Insight -->
        <div class="bo-insight-card">
          <div class="bo-scale-wrapper">
            <div class="bo-scale-header">
              <span>Complexity Scale</span>
              <span class="bo-scale-value">${timeData.name}</span>
            </div>
            <div class="bo-scale-track">
              <div class="bo-scale-bar"></div>
              <div class="bo-scale-marker" style="left: ${timePos}%"></div>
            </div>
            <div class="bo-scale-labels">
              <span>O(1)</span>
              <span>O(n)</span>
              <span>O(n²)</span>
            </div>
          </div>
          <div class="bo-reasoning">
            <span class="bo-tip-icon">💡</span>
            <span class="bo-reasoning-text">${reasoning || suggestion || 'Analysis complete.'}</span>
          </div>
        </div>

      </div>
    </div>
  `;

  complexityDisplayed = true;
}

/**
 * Shows a loading spinner while analysis is in progress
 */
function showLoadingState() {
  const container = getOrCreateContainer('loading');
  if (!container) return;

  container.innerHTML = `
    <div class="complexity-header">
      <div class="header-left">
        <span class="complexity-icon-wrapper spin">${ICONS.bolt}</span>
        <span class="complexity-title">Analyzing Solution...</span>
      </div>
    </div>
    <div class="complexity-content loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">Crunching the numbers...</p>
    </div>
  `;
}

/**
 * Displays an error message when analysis fails
 * @param {string} error - Error message to display
 */
function showErrorState(error) {
  const container = getOrCreateContainer('error');
  if (!container) return;

  container.innerHTML = `
    <div class="complexity-header">
      <div class="header-left">
        <span class="complexity-icon-wrapper error-icon">${ICONS.warning}</span>
        <span class="complexity-title">Analysis Failed</span>
      </div>
    </div>
    <div class="complexity-content error-content">
      <p class="error-message">${error}</p>
      <button class="retry-button" onclick="location.reload()">Reload Page</button>
    </div>
  `;
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
      displayComplexity(response.timeComplexity, response.spaceComplexity, response.reasoning, response.suggestion);
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

    // Try to show a toast/banner to the user if possible
    const resultPanel = document.querySelector('[data-e2e-locator="submission-result"]') ||
      document.querySelector('.submission-panel') ||
      document.querySelector('[class*="result"]');

    if (resultPanel) {
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '10px';
      errorDiv.style.margin = '10px 0';
      errorDiv.style.background = '#fee2e2';
      errorDiv.style.color = '#dc2626';
      errorDiv.style.borderRadius = '8px';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.fontSize = '13px';
      errorDiv.innerHTML = '<strong>BigOlogy Updated:</strong> Please refresh the page to continue using the extension.';
      resultPanel.insertBefore(errorDiv, resultPanel.firstChild);
    }
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
