/**
 * BigOlogy - Popup Script
 * 
 * Handles the extension popup interface
 * 
 * @author Adithya
 * @see https://adithyapaib.com
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('BigOlogy Popup Loaded');
  
  // Check if we're on a LeetCode page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const url = tabs[0].url;
      if (url && url.includes('leetcode.com')) {
        console.log('Currently on LeetCode');
      }
    }
  });
});
