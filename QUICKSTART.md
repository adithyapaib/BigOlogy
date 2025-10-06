# Quick Start Guide 🚀

Get up and running with BigOlogy in 5 minutes!

## Step 1: Create Icon Files (2 minutes)

The extension needs PNG icons. Choose the fastest method:

### Option A: Online Converter (Recommended - No Installation Needed)
1. Go to https://www.aconvert.com/image/svg-to-png/
2. Upload `icons/icon.svg`
3. Click "Convert Now"
4. Download the PNG
5. Resize it to create three versions:
   - Go to https://www.iloveimg.com/resize-image
   - Upload the PNG and create:
     - `icon16.png` (16x16 px)
     - `icon48.png` (48x48 px)
     - `icon128.png` (128x128 px)
6. Save all three in the `icons/` folder

### Option B: Use Placeholder Icons (30 seconds)
Create any three PNG files (any simple image) and name them:
- `icon16.png`
- `icon48.png`
- `icon128.png`

Place them in the `icons/` folder. The extension will work fine with placeholder icons!

## Step 2: Install Extension (1 minute)

1. Open Chrome and go to: `chrome://extensions/`
2. Turn ON "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" button
4. Select the `BigOlogy` folder
5. Done! ✅

## Step 3: Test It (2 minutes)

1. Go to: https://leetcode.com/problems/two-sum/
2. Click on "Code" tab
3. Paste this simple solution:

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
```

4. Click "Submit" button
5. Wait for results...
6. **Look for the purple gradient card!** 🎉

You should see:
- ⚡ Complexity Analysis
- Time Complexity: O(n)
- Space Complexity: O(n)

## Troubleshooting (if needed)

### Icons Not Loading?
- Make sure PNG files are in `icons/` folder
- Files must be named exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Or temporarily comment out icon references in manifest.json

### Extension Not Working?
1. Open DevTools (F12) on LeetCode page
2. Check Console for errors
3. Make sure you're on a problem page (not homepage)
4. Try refreshing the page

### No Complexity Card Appearing?
1. Check that submission was successful
2. Look for "Analyzing Complexity..." message
3. Wait 5-10 seconds for API response
4. Check Console for any error messages

### API Errors?
- Make sure you have internet connection
- The API endpoint might be temporarily down
- Check Network tab in DevTools for request status

## What's Next?

✅ **Extension is working!** Now you can:
- Submit solutions to any LeetCode problem
- Automatically see complexity analysis
- Learn from the AI's complexity insights
- Improve your algorithm optimization skills

## Tips for Best Results

1. **Write complete solutions**: The AI analyzes the full code
2. **Wait for results**: Analysis takes 3-5 seconds
3. **Check different problems**: Test with various algorithms
4. **Compare complexities**: Learn what makes code efficient

## Common Questions

**Q: Do I need an API key?**
A: No! The extension uses a free AI endpoint.

**Q: Does it work with all programming languages?**
A: Yes! Python, JavaScript, Java, C++, and all LeetCode languages.

**Q: Will it slow down LeetCode?**
A: No, it runs in the background without affecting performance.

**Q: Can I customize the appearance?**
A: Yes! Edit `styles.css` to change colors and layout.

**Q: Is my code sent anywhere?**
A: Only to the AI API for analysis. No data is stored.

## Need Help?

- Read the full `README.md` for detailed information
- Check `TESTING_GUIDE.md` for comprehensive testing
- See `ICON_INSTRUCTIONS.md` for icon creation help
- Review Console logs in DevTools for debugging

## Success! 🎉

If you see the complexity analysis card, you're all set!

**Happy coding and may your complexities always be optimal!** ⚡🚀

---

**Pro Tip**: Open the extension popup (click the icon in Chrome toolbar) to see the extension status and quick instructions!
