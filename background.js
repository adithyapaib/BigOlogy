/**
 * BigOlogy - Background Service Worker
 * 
 * This service worker handles API communication with AI endpoints
 * to analyze code complexity. It runs in the background and processes
 * messages from the content script.
 * 
 * PRIMARY: Puter AI (Claude Sonnet 4) via offscreen document
 * FALLBACK: Pollinations.ai
 * 
 * @author Adithya
 * @see https://adithyapaib.com
 */

console.log('BigOlogy - Background Script Loaded (Puter + Pollinations)');

// Track offscreen document state
let offscreenDocumentCreated = false;

/**
 * Creates the offscreen document if it doesn't exist
 * The offscreen document is used to load the Puter SDK
 */
async function ensureOffscreenDocument() {
  if (offscreenDocumentCreated) {
    return;
  }

  try {
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
      offscreenDocumentCreated = true;
      return;
    }

    // Create the offscreen document
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'], // Using DOM_PARSER as a valid reason
      justification: 'Required to load Puter SDK for AI-powered code analysis'
    });

    offscreenDocumentCreated = true;
    console.log('Offscreen document created successfully');

    // Wait a bit for the Puter SDK to load
    await new Promise(resolve => setTimeout(resolve, 1500));

  } catch (error) {
    console.error('Error creating offscreen document:', error);
    throw error;
  }
}

/**
 * Message listener for handling complexity analysis requests
 * Responds asynchronously after API call completes
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeComplexity') {
    analyzeCodeComplexity(request.code, request.language)
      .then(result => {
        // If the function returned a structured error object, forward it as-is
        sendResponse(result);
      })
      .catch(error => {
        // Unexpected exception - send structured response
        console.error('Unexpected error in message handler:', error);
        sendResponse({
          success: false,
          error: error.message || String(error)
        });
      });
    return true; // Keep message channel open for async response
  }
});

/**
 * Generates the analysis prompt for the AI
 * 
 * @param {string} code - The source code to analyze
 * @param {string} language - Programming language of the code
 * @returns {string} The formatted prompt
 */
function generatePrompt(code, language) {
  // Truncate code to avoid issues
  const truncatedCode = code.substring(0, 1500);

  return `You are an expert algorithm complexity analyzer. Analyze the following ${language} code thoroughly.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation outside JSON):
{
  "timeComplexity": {
    "best": "O(?)",
    "average": "O(?)",
    "worst": "O(?)"
  },
  "spaceComplexity": {
    "best": "O(?)",
    "average": "O(?)",
    "worst": "O(?)"
  },
  "detailedExplanation": {
    "timeAnalysis": "Explain what causes the time complexity - mention specific loops, recursion, or operations",
    "spaceAnalysis": "Explain what causes the space complexity - mention data structures, recursion stack, etc"
  },
  "pattern": "Name of the algorithmic pattern used (e.g., 'Sliding Window', 'Two Pointers', 'DFS', 'Hash Map', 'Dynamic Programming')",
  "codeQuality": {
    "score": 85,
    "readability": 90,
    "efficiency": 80,
    "bestPractices": 85,
    "summary": "Brief 1-sentence summary of code quality"
  },
  "suggestion": "One actionable tip to improve, or 'Optimal solution' if already best"
}

Code to analyze:
\`\`\`${language}
${truncatedCode}
\`\`\`

Rules:
- Use standard Big O notation: O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n), O(n!)
- Code quality scores must be integers from 0-100
- Be specific in explanations (mention variable names, line numbers if relevant)
- Return ONLY the JSON object, nothing else`;
}

/**
 * Analyzes code complexity using AI APIs
 * PRIMARY: Puter AI (Claude Sonnet 4)
 * FALLBACK: Pollinations.ai
 * 
 * @param {string} code - The source code to analyze
 * @param {string} language - Programming language of the code
 * @returns {Promise<Object>} Analysis result with success status and complexity data
 */
async function analyzeCodeComplexity(code, language) {
  try {
    console.log('Starting complexity analysis for', language);

    const prompt = generatePrompt(code, language);
    console.log('Generated prompt length:', prompt.length);

    let responseText = null;
    let usedFallback = false;

    // Try PRIMARY: Puter AI (Claude Sonnet 4)
    try {
      console.log('Attempting PRIMARY: Puter AI (Claude Sonnet 4)...');
      responseText = await callPuterAI(prompt);
      console.log('Puter AI response received successfully');
    } catch (puterError) {
      console.warn('Puter AI failed, switching to fallback:', puterError.message);
      usedFallback = true;
    }

    // Try FALLBACK: Pollinations.ai
    if (!responseText) {
      try {
        console.log('Attempting FALLBACK: Pollinations.ai...');
        responseText = await callPollinationsAI(prompt);
        console.log('Pollinations.ai response received successfully');
      } catch (pollinationsError) {
        console.error('Both AI providers failed');
        return {
          success: false,
          error: `AI services unavailable. Puter: ${usedFallback ? 'failed' : 'not tried'}. Pollinations: ${pollinationsError.message}`
        };
      }
    }

    console.log('Full API response:', responseText);

    // Parse the complexity from the API response
    const complexityData = parseComplexityFromText(responseText);
    console.log('Parsed complexity:', complexityData);

    return {
      success: true,
      // Time complexity - Best/Average/Worst cases
      timeComplexity: complexityData.timeComplexity,
      // Space complexity - Best/Average/Worst cases  
      spaceComplexity: complexityData.spaceComplexity,
      // Detailed explanations
      detailedExplanation: complexityData.detailedExplanation || {
        timeAnalysis: "Analysis provided by BigOlogy AI",
        spaceAnalysis: "Analysis provided by BigOlogy AI"
      },
      // Code quality metrics
      codeQuality: complexityData.codeQuality || {
        score: 75,
        readability: 75,
        efficiency: 75,
        bestPractices: 75,
        summary: "Code analysis complete"
      },
      // Optimization suggestion
      suggestion: complexityData.suggestion || "Consider optimizing nested loops if possible.",
      // Provider info
      provider: usedFallback ? 'pollinations' : 'puter-claude-sonnet-4'
    };

  } catch (error) {
    console.error('Error in analyzeCodeComplexity:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: `${error.name}: ${error.message}`
    };
  }
}

/**
 * Calls Puter AI via the offscreen document
 * Uses Claude Sonnet 4 model
 * 
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} The AI response text
 */
async function callPuterAI(prompt) {
  // Ensure offscreen document exists
  await ensureOffscreenDocument();

  // Send message to offscreen document
  const response = await chrome.runtime.sendMessage({
    action: 'puterAIChat',
    prompt: prompt
  });

  if (!response) {
    throw new Error('No response from offscreen document');
  }

  if (!response.success) {
    throw new Error(response.error || 'Puter AI request failed');
  }

  return response.response;
}

/**
 * Calls Pollinations.ai as a fallback
 * 
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} The AI response text
 */
async function callPollinationsAI(prompt) {
  const encodedPrompt = encodeURIComponent(prompt);
  const apiUrl = `https://text.pollinations.ai/${encodedPrompt}`;

  // Helper: fetch with retries for transient 5xx errors
  async function fetchWithRetries(url, options = {}, attempts = 3, backoffMs = 500) {
    let lastError = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const resp = await fetch(url, options);
        // If server error (5xx), treat as transient and retry
        if (resp.status >= 500 && resp.status < 600) {
          const text = await resp.text().catch(() => '');
          lastError = new Error(`Server error ${resp.status}: ${text}`);
          console.warn(`Attempt ${i + 1} failed with ${resp.status}. Retrying...`);
          // exponential backoff
          await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, i)));
          continue;
        }
        return resp;
      } catch (err) {
        // Network error, also retry
        lastError = err;
        console.warn(`Attempt ${i + 1} network error:`, err.message || err);
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, i)));
      }
    }
    throw lastError;
  }

  const response = await fetchWithRetries(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/plain'
    }
  }, 3, 600);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API returned ${response.status}: ${errorText}`);
  }

  return await response.text();
}

/**
 * Parses complexity information from API text response
 * Handles the enhanced JSON format with best/avg/worst cases, explanations, and code quality
 * 
 * @param {string} text - Raw API response text
 * @returns {Object} Object containing full analysis data
 */
function parseComplexityFromText(text) {
  // Default structure for fallback
  const defaultResult = {
    timeComplexity: {
      best: 'O(n)',
      average: 'O(n)',
      worst: 'O(n)'
    },
    spaceComplexity: {
      best: 'O(1)',
      average: 'O(1)',
      worst: 'O(1)'
    },
    detailedExplanation: {
      timeAnalysis: 'Analysis could not be determined',
      spaceAnalysis: 'Analysis could not be determined'
    },
    pattern: 'Algorithm Analysis',
    codeQuality: {
      score: 70,
      readability: 70,
      efficiency: 70,
      bestPractices: 70,
      summary: 'Unable to fully analyze code quality'
    },
    suggestion: 'Consider reviewing the algorithm for optimization opportunities'
  };

  try {
    console.log('Parsing full text:', text);

    // Clean up the text
    const cleanText = text.trim();

    // Try to parse as JSON first (primary method for new format)
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed from JSON:', parsed);

        // Check if it's the new enhanced format (with nested timeComplexity object)
        if (parsed.timeComplexity && typeof parsed.timeComplexity === 'object' && parsed.timeComplexity.worst) {
          // New enhanced format - return as-is with defaults filled in
          return {
            timeComplexity: {
              best: parsed.timeComplexity.best || 'O(n)',
              average: parsed.timeComplexity.average || 'O(n)',
              worst: parsed.timeComplexity.worst || 'O(n)'
            },
            spaceComplexity: {
              best: parsed.spaceComplexity?.best || 'O(1)',
              average: parsed.spaceComplexity?.average || 'O(1)',
              worst: parsed.spaceComplexity?.worst || 'O(1)'
            },
            detailedExplanation: {
              timeAnalysis: parsed.detailedExplanation?.timeAnalysis || 'Time analysis not available',
              spaceAnalysis: parsed.detailedExplanation?.spaceAnalysis || 'Space analysis not available'
            },
            pattern: parsed.pattern || 'General Algorithm',
            codeQuality: {
              score: parsed.codeQuality?.score ?? 75,
              readability: parsed.codeQuality?.readability ?? 75,
              efficiency: parsed.codeQuality?.efficiency ?? 75,
              bestPractices: parsed.codeQuality?.bestPractices ?? 75,
              summary: parsed.codeQuality?.summary || 'Code analysis complete'
            },
            suggestion: parsed.suggestion || 'No specific suggestions'
          };
        }

        // Old format compatibility (simple string values)
        if (parsed.timeComplexity && typeof parsed.timeComplexity === 'string') {
          const timeVal = parsed.timeComplexity;
          const spaceVal = parsed.spaceComplexity || 'O(1)';
          return {
            timeComplexity: { best: timeVal, average: timeVal, worst: timeVal },
            spaceComplexity: { best: spaceVal, average: spaceVal, worst: spaceVal },
            detailedExplanation: {
              timeAnalysis: parsed.reasoning || 'Analysis from BigOlogy AI',
              spaceAnalysis: 'Space analysis not available in legacy format'
            },
            codeQuality: defaultResult.codeQuality,
            suggestion: parsed.suggestion || 'No specific suggestions'
          };
        }
      } catch (e) {
        console.log('JSON parse failed, continuing with regex...', e.message);
      }
    }

    // Fallback: Regex patterns for non-JSON responses
    // Priority 1: Look for "Time Complexity: O(...)" pattern
    const timeMatch1 = cleanText.match(/Time\s*Complexity[:\s]*O\(([^)]+)\)/i);
    const spaceMatch1 = cleanText.match(/Space\s*Complexity[:\s]*O\(([^)]+)\)/i);

    if (timeMatch1 && spaceMatch1) {
      console.log('Matched Pattern 1 (Time/Space Complexity:)');
      const timeVal = `O(${timeMatch1[1].trim()})`;
      const spaceVal = `O(${spaceMatch1[1].trim()})`;
      return {
        ...defaultResult,
        timeComplexity: { best: timeVal, average: timeVal, worst: timeVal },
        spaceComplexity: { best: spaceVal, average: spaceVal, worst: spaceVal }
      };
    }

    // Priority 2: Look for any O(...) patterns in order
    const oNotations = cleanText.match(/O\([^)]+\)/gi);
    if (oNotations && oNotations.length >= 2) {
      console.log('Matched O() notations:', oNotations);
      const timeVal = oNotations[0].trim();
      const spaceVal = oNotations[1].trim();
      return {
        ...defaultResult,
        timeComplexity: { best: timeVal, average: timeVal, worst: timeVal },
        spaceComplexity: { best: spaceVal, average: spaceVal, worst: spaceVal }
      };
    }

    if (oNotations && oNotations.length >= 1) {
      const timeVal = oNotations[0].trim();
      return {
        ...defaultResult,
        timeComplexity: { best: timeVal, average: timeVal, worst: timeVal }
      };
    }

    console.warn('Could not parse any complexity, using defaults');
    return defaultResult;

  } catch (error) {
    console.error('Error parsing complexity:', error);
    return defaultResult;
  }
}

/**
 * Extension installation and update handler
 * Logs installation events for debugging
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('BigOlogy installed successfully!');
  } else if (details.reason === 'update') {
    console.log('BigOlogy updated to version', chrome.runtime.getManifest().version);
  }
});
