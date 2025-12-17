# Changelog for BigOlogy

All notable changes to BigOlogy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-16

### Added
- **Code Quality Score (0-100)**: AI rates your code on readability, efficiency, and best practices
- **Best/Average/Worst Case Analysis**: Get all three complexity scenarios for both time and space
- **Detailed AI Explanations**: Understand *why* your code has that complexity
  - Time analysis: Explains loops, recursion, and operations affecting time
  - Space analysis: Explains data structures, recursion stack, and memory usage
- **Visual Score Breakdown**: Progress bars for readability, efficiency, and best practices
- **Circular Progress Indicator**: Beautiful animated score display
- **Enhanced UI Design**: Modern grid layout with hover effects and animations

### Changed
- Completely redesigned analysis display with 3-column layout
- Updated AI prompt to request comprehensive analysis data
- Improved response parsing with fallback support for legacy format
- Updated popup to showcase new v2.0 features
- Enhanced dark mode support for new UI components

### Technical
- Extended response structure to include nested complexity objects
- Added code quality metrics parsing (score, readability, efficiency, bestPractices)
- Implemented animated SVG circular progress ring
- Added CSS grid layout for responsive enhanced content
- Improved error handling and default value fallbacks

---

## [1.0.0] - 2025-10-06

### Added
- Initial release of BigOlogy (previously LeetCode Complexity Analyzer)
- AI-powered complexity analysis using Pollinations AI API
- Automatic detection of code submissions on LeetCode
- Native UI matching LeetCode's design system
- Support for all programming languages on LeetCode
- Light and dark mode support
- Real-time complexity analysis display
- Time complexity detection in Big O notation
- Space complexity detection in Big O notation
- Error handling for API failures
- Loading states during analysis
- Professional documentation (README, CONTRIBUTING, LICENSE)
- Chrome Extension manifest v3 support

### Features
- 🤖 AI-powered analysis
- ⚡ Instant results after submission
- 🎨 Native LeetCode UI integration
- 🌐 Multi-language support
- 🔒 Privacy-first (no data collection)
- 📱 Responsive design

### Technical
- Content script for DOM monitoring
- Background service worker for API calls
- CSS matching LeetCode variables
- Robust error handling
- Multiple fallback parsers for API responses
- Detailed logging for debugging

---

## Future Releases

### Planned for v1.1.0
- Detailed complexity explanations
- Best/Average/Worst case analysis
- Settings page for customization

### Planned for v1.2.0
- Historical complexity tracking
- Export analysis reports
- Optimization suggestions

### Planned for v2.0.0
- Support for more coding platforms
- Comparison with optimal solutions
- Advanced analytics dashboard

---

**Legend:**
- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
