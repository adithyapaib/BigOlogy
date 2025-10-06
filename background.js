/**
 * BigOlogy - Background Service Worker
 * 
 * This service worker handles API communication with the AI endpoint
 * to analyze code complexity. It runs in the background and processes
 * messages from the content script.
 * 
 * @author Adithya
 * @see https://adithyapaib.com
 */

console.log('BigOlogy - Background Script Loaded');

/**
 * Message listener for handling complexity analysis requests
 * Responds asynchronously after API call completes
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeComplexity') {
    analyzeCodeComplexity(request.code, request.language)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message 
      }));
    return true; // Keep message channel open for async response
  }
});

/**
 * Analyzes code complexity using AI API
 * 
 * @param {string} code - The source code to analyze
 * @param {string} language - Programming language of the code
 * @returns {Promise<Object>} Analysis result with success status and complexity data
 */
async function analyzeCodeComplexity(code, language) {
  try {
    console.log('Starting complexity analysis for', language);
    
    // Truncate code to avoid URL length issues
    const truncatedCode = code.substring(0, 1000);
    
    // Create a more detailed and clear prompt
    const prompt = `You are a Big O complexity analyzer. Analyze the following ${language} code and provide ONLY the time and space complexity in this exact format:

Time Complexity: O(?)
Space Complexity: O(?)

Code to analyze:
${truncatedCode}

Remember: Provide ONLY the two lines with Time Complexity and Space Complexity. Use standard Big O notation like O(1), O(n), O(log n), O(n^2), O(2^n), etc.`;
    
    console.log('Prompt:', prompt.substring(0, 150) + '...');
    
    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);
    const apiUrl = `https://text.pollinations.ai/${encodedPrompt}`;
    
    console.log('Making request to API...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API returned ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Full API response:', responseText);
    
    // Parse the complexity from the API response
    const complexityData = parseComplexityFromText(responseText);

    console.log('Parsed complexity:', complexityData);

    return {
      success: true,
      timeComplexity: complexityData.timeComplexity,
      spaceComplexity: complexityData.spaceComplexity
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
 * Parses complexity information from API text response
 * Handles multiple response formats with fallback patterns
 * 
 * @param {string} text - Raw API response text
 * @returns {Object} Object containing timeComplexity and spaceComplexity
 */
function parseComplexityFromText(text) {
  try {
    console.log('Parsing full text:', text);
    
    // Clean up the text
    const cleanText = text.trim();
    
    // Try to parse as JSON first
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.timeComplexity && parsed.spaceComplexity) {
          console.log('Parsed from JSON:', parsed);
          return parsed;
        }
      } catch (e) {
        console.log('JSON parse failed, continuing with regex...');
      }
    }

    // Priority 1: Look for "Time Complexity: O(...)" pattern (most specific)
    const timeMatch1 = cleanText.match(/Time\s*Complexity[:\s]*O\(([^)]+)\)/i);
    const spaceMatch1 = cleanText.match(/Space\s*Complexity[:\s]*O\(([^)]+)\)/i);

    if (timeMatch1 && spaceMatch1) {
      console.log('Matched Pattern 1 (Time/Space Complexity:)');
      return {
        timeComplexity: `O(${timeMatch1[1].trim()})`,
        spaceComplexity: `O(${spaceMatch1[1].trim()})`
      };
    }

    // Priority 2: Look for "Time: O(...)" pattern
    const timeMatch2 = cleanText.match(/Time[:\s]*O\(([^)]+)\)/i);
    const spaceMatch2 = cleanText.match(/Space[:\s]*O\(([^)]+)\)/i);

    if (timeMatch2 && spaceMatch2) {
      console.log('Matched Pattern 2 (Time:/Space:)');
      return {
        timeComplexity: `O(${timeMatch2[1].trim()})`,
        spaceComplexity: `O(${spaceMatch2[1].trim()})`
      };
    }

    // Priority 3: Extract using broader regex patterns with quotes
    const timeMatch3 = cleanText.match(/time[^:]*:\s*["']?(O\([^)"']+\))["']?/i);
    const spaceMatch3 = cleanText.match(/space[^:]*:\s*["']?(O\([^)"']+\))["']?/i);

    if (timeMatch3 && spaceMatch3) {
      console.log('Matched Pattern 3 (Quoted)');
      return {
        timeComplexity: timeMatch3[1].trim(),
        spaceComplexity: spaceMatch3[1].trim()
      };
    }

    // Priority 4: Look for any O(...) patterns in order (first = time, second = space)
    const oNotations = cleanText.match(/O\([^)]+\)/gi);
    if (oNotations && oNotations.length >= 2) {
      console.log('Matched Pattern 4 (Sequential O() notations):', oNotations);
      return {
        timeComplexity: oNotations[0].trim(),
        spaceComplexity: oNotations[1].trim()
      };
    }
    
    // Priority 5: if we find at least one O(...), use it for both
    if (oNotations && oNotations.length >= 1) {
      console.log('Matched Pattern 5 (Single O() notation):', oNotations[0]);
      return {
        timeComplexity: oNotations[0].trim(),
        spaceComplexity: oNotations[0].trim()
      };
    }

    console.warn('Could not parse any complexity, using analysis-needed defaults');
    return {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)'
    };
  } catch (error) {
    console.error('Error parsing complexity:', error);
    return {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)'
    };
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
