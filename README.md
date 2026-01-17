# LeetCode Documentation Generator

A Chrome extension that helps students document their LeetCode problem solutions in a standardized .docx format with intelligent code extraction and automatic page refresh capabilities.

## Features

- ✅ **Smart Code Extraction**: Automatically capture LeetCode submission details from submission pages
- ✅ **Keyboard Shortcut**: Quick capture with Ctrl+Shift+K - opens popup and auto-captures
- ✅ **Auto-Redirect & Extract**: Handles `/submissions/detail/{id}/` URLs automatically
- ✅ **Intelligent Line Number Removal**: Removes line numbers while preserving code indentation
- ✅ **HTML Element Filtering**: Ignores React syntax highlighter line number elements
- ✅ **Auto-Refresh**: Automatically refreshes page if content script isn't loaded
- ✅ **Problem Management**: Manage multiple problems in a problem set with full CRUD operations
- ✅ **Drag & Drop Reordering**: Reorder problems with intuitive drag-and-drop interface
- ✅ **Professional Document Generation**: Generate beautifully formatted .docx documents
- ✅ **Multi-Language Support**: Smart language detection (handles multiple code blocks on page)
- ✅ **Data Validation**: Comprehensive validation of all captured data
- ✅ **Visual Feedback**: Real-time status updates with loading animations
- ✅ **Clean User Interface**: Simple and intuitive design with responsive feedback

## Recent Enhancements

### ⌨️ Keyboard Shortcut Capture
- **Quick Access**: Press Ctrl+Shift+K to open popup and auto-capture
- **Seamless Workflow**: Instantly capture without clicking buttons
- **Customizable**: Change shortcut at chrome://extensions/shortcuts
- **Auto-Redirect Support**: Works on both URL formats

### 🔄 Smart URL Handling
- **Detail-Only URL Support**: Handles `/submissions/detail/{id}/` URLs
- **Auto-Redirect**: Automatically redirects to proper format
- **Auto-Extract**: Extracts data after redirect without manual intervention
- **Problem Slug Detection**: Finds correct problem from page content

### 🔄 Auto-Refresh Feature
- **Smart Detection**: Automatically detects when content script isn't loaded
- **Seamless Recovery**: Refreshes page and retries capture automatically
- **Visual Feedback**: Shows countdown timer and loading states during refresh
- **No Manual Intervention**: Users don't need to manually refresh pages

### 🎨 Enhanced User Experience
- **Loading States**: Button text changes during operations (Checking → Refreshing → Capturing)
- **Animated Spinners**: Visual loading indicators for all async operations
- **Status Messages**: Color-coded feedback with automatic hide timers
- **Error Recovery**: Graceful handling of common issues with clear guidance

## Tested With

- ✅ C++, Python submissions on LeetCode
- ✅ React syntax highlighter pages with HTML line numbers
- ✅ Pages with mixed line number formats
- ✅ Content script loading edge cases

## Project Structure

```
leetcode-doc-generator/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html            # Popup UI with enhanced status indicators
├── popup.js              # Popup logic with auto-refresh capabilities
├── popup.css             # Popup styling with loading animations
├── content.js            # Advanced DOM extraction & code cleaning
├── background.js         # Background service worker
├── docxGenerator.js      # Professional .docx file generation
├── storage.js            # Chrome storage operations (CRUD)
├── docx.min.js           # docx library (CDN loaded)
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Installation (Development)

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `leetcode-doc-generator` directory

## Usage

### 1. Set up problem set info:
- Click the extension icon in the toolbar
- Enter your problem set title and student name
- Click "Save Problem Set Info"

### 2. Capture submissions:

**Method 1: Using Keyboard Shortcut (Fastest)**
- Navigate to any LeetCode submission page (standard or detail-only URL)
- Press **Ctrl+Shift+K** (or customize at chrome://extensions/shortcuts)
- Popup opens and automatically captures the submission
- Works on both URL formats:
  - `/problems/{slug}/submissions/{id}/`
  - `/submissions/detail/{id}/` (auto-redirects and extracts)

**Method 2: Manual Capture**
- Navigate to a LeetCode submission page
- Click the extension icon
- Click "Capture from Current Page"
- **Auto-refresh**: If content script isn't loaded, the page will refresh automatically
- **Visual feedback**: Watch the button states and status messages
- The problem will be added to your list with clean, properly formatted code

### 3. Manage problems:
- **Reorder**: Use drag-and-drop
- **Edit**: Modify problem details with the edit button
- **Delete**: Remove individual problems
- **Clear All**: Remove all problems at once

### 4. Generate document:
- Click "Generate Document" to download a formatted .docx file
- Filename format: `{Student Name} - {Problem Set Title}.docx`

### 5. Start new problem set:
- Click "Start New Problem Set" to clear all data and begin fresh

## Document Format

Generated .docx documents include:

- **Header:** Problem set title (bold, 24pt) and student name (12pt)
- **For each problem:**
  - Problem name (bold, 18pt, Arial)
  - Submission link (12pt, Arial, black text)
  - Clean code (10pt, Courier New, red text, monospace)
- Professional sans-serif font (Arial) for all non-code text
- Proper spacing between sections
- **Clean formatting**: No line numbers, preserved indentation

## Technical Details

### Advanced Code Extraction

The extension uses sophisticated DOM parsing and cleaning:

#### HTML Element Filtering
- Removes React syntax highlighter line number elements
- Filters out `<span class="linenumber react-syntax-highlighter-line-number">`
- Cleans number-only spans with line number styling
- Preserves actual code content while removing visual artifacts

#### Intelligent Line Number Removal
- **Pattern Recognition**: Detects various line number formats
- **Indentation Preservation**: Maintains original code structure
- **Smart Filtering**: Removes number-only lines completely
- **Multi-format Support**: Handles `1 code`, `1.code`, `1|code`, etc.

#### Content Script Management
- **Auto-detection**: Checks if content script is ready
- **Auto-refresh**: Refreshes page if script isn't loaded
- **Retry Logic**: Multiple attempts with exponential backoff
- **Visual Feedback**: Real-time status updates during process

### Data Validation

Comprehensive validation for all captured data:
- **Problem name**: 1-300 characters, required
- **Submission link**: Valid LeetCode URL format
- **Code**: 1-100,000 characters with structure validation
- **Language**: Valid programming language string
- **Problem set info**: Title (2-200 chars), Name (2-100 chars)

### Storage & State Management

Uses Chrome's `chrome.storage.local` API:
- Problem set info stored separately from problems
- Each problem stored with unique ID and metadata
- Supports full CRUD operations (Create, Read, Update, Delete)
- Maintains order for drag-and-drop functionality
- Persistent across browser sessions

## User Experience Features

### Visual Feedback System
- **Button States**: Dynamic button text during operations
- **Loading Animations**: CSS spinners for async operations
- **Status Messages**: Color-coded feedback (success, error, refreshing)
- **Progress Indicators**: Countdown timers during page refresh

### Error Handling
- **Graceful Degradation**: Clear error messages with recovery suggestions
- **Auto-recovery**: Automatic page refresh for common issues
- **Validation Feedback**: Specific error messages for data validation failures
- **Debug Logging**: Comprehensive console logging for troubleshooting

## Development Status

✅ **Production Ready** - All core features implemented, tested, and enhanced

## Requirements

- Chrome browser (Manifest V3 compatible)
- Internet connection (for docx library CDN)
- LeetCode submission pages (fully loaded)

## Browser Permissions

- `storage`: For saving problems and settings
- `activeTab`: For reading submission pages and auto-refresh
- `host_permissions`: LeetCode domain access

## Known Limitations

- Only works on LeetCode submission pages
- Requires JavaScript to be enabled
- Maximum 100,000 characters per code submission
- Auto-refresh requires `activeTab` permission

## Troubleshooting

### Common Issues
1. **"Content script not loaded"**: Extension will auto-refresh the page
2. **Code extraction fails**: Ensure page is fully loaded before capture
3. **Line numbers in output**: Updated extraction should handle this automatically
4. **Missing indentation**: Enhanced algorithm preserves original formatting

### Debug Information
- Check browser console for detailed extraction logs
- Extension logs all major operations and decisions
- Status messages provide real-time feedback

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests. The extension is designed to be robust and user-friendly for academic documentation needs.
