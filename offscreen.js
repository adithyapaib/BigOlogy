/**
 * BigOlogy - Offscreen Script
 * 
 * This script runs in an offscreen document to access the Puter AI API.
 * Chrome extension service workers cannot load external scripts via script tags,
 * so we use this offscreen document as a bridge.
 * 
 * Uses Claude Sonnet 4 model via Puter AI.
 * 
 * @author Adithya
 * @see https://adithyapaib.com
 */

console.log('BigOlogy - Offscreen Script Loaded');

/**
 * Message listener for handling AI requests from the background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'puterAIChat') {
        handlePuterAIChat(request.prompt)
            .then(result => sendResponse(result))
            .catch(error => {
                console.error('Puter AI error:', error);
                sendResponse({
                    success: false,
                    error: error.message || String(error)
                });
            });
        return true; // Keep message channel open for async response
    }
});

/**
 * Handles Puter AI chat request using Claude Sonnet 4
 * 
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<Object>} Result with success status and response text
 */
async function handlePuterAIChat(prompt) {
    try {
        console.log('Starting Puter AI request with Claude Sonnet 4...');

        // Check if puter is available
        if (typeof puter === 'undefined' || !puter.ai) {
            throw new Error('Puter SDK not loaded');
        }

        // Use Claude Sonnet 4 model with streaming
        const chatResp = await puter.ai.chat(prompt, {
            model: 'claude-sonnet-4',
            stream: true
        });

        // Collect streamed response
        let fullResponse = '';
        for await (const part of chatResp) {
            if (part?.text) {
                fullResponse += part.text;
            }
        }

        console.log('Puter AI response received, length:', fullResponse.length);

        return {
            success: true,
            response: fullResponse
        };

    } catch (error) {
        console.error('Puter AI chat error:', error);
        throw error;
    }
}
