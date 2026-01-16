# LeetCode Documentation Generator

A Chrome extension that helps students document their LeetCode problem solutions in a standardized .docx format.

## Features

- ✅ Automatically capture LeetCode submission details from submission pages
- ✅ Extract problem name, code, programming language, and submission link
- ✅ Manage multiple problems in a problem set
- ✅ Reorder problems with drag-and-drop or arrow buttons
- ✅ Edit and delete individual problems
- ✅ Generate professionally formatted .docx documents
- ✅ Smart language detection (handles multiple code blocks on page)
- ✅ Validates captured data before saving
- ✅ Simple and intuitive interface

## Tested With

- ✅ C++ submissions on LeetCode
- ✅ Multiple programming languages (Python, Java, JavaScript, etc.)
- ✅ Various LeetCode submission page formats

## Project Structure

```
leetcode-doc-generator/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html            # Popup UI
├── popup.js              # Popup logic and event handlers
├── popup.css             # Popup styling
├── content.js            # LeetCode page DOM extraction & data capture
├── background.js         # Background service worker
├── docxGenerator.js      # .docx file generation with formatting
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

1. **Set up problem set info:**
   - Click the extension icon in the toolbar
   - Enter your problem set title and student name
   - Click "Save Problem Set Info"

2. **Capture submissions:**
   - Navigate to a LeetCode submission page (e.g., `leetcode.com/problems/*/submissions/*` or `leetcode.com/submissions/detail/*`)
   - Click the extension icon
   - Click "Capture from Current Page"
   - The problem will be added to your list

3. **Manage problems:**
   - Reorder using drag-and-drop or arrow buttons
   - Edit problem details with the "Edit" button
   - Delete problems with the "Delete" button
   - Clear all problems with "Clear All"

4. **Generate document:**
   - Click "Generate Document" to download a formatted .docx file
   - Filename format: `{Student Name} - {Problem Set Title}.docx`

5. **Start new problem set:**
   - Click "Start New Problem Set" to clear all data and begin fresh

## Document Format

Generated .docx documents include:

- **Header:** Problem set title (bold, 24pt) and student name (12pt)
- **For each problem:**
  - Problem name (bold, 18pt, Arial)
  - Submission link (12pt, Arial, black text)
  - Code (10pt, Courier New, red text, monospace)
- Professional sans-serif font (Arial) for all non-code text
- Proper spacing between sections

## Technical Details

### Smart Code Extraction

The extension uses intelligent DOM parsing to extract code:
- Filters out ASCII art and decorative elements
- Handles multiple code blocks on the same page
- Skips `<p>` tag containers (wrong code blocks)
- Prioritizes non-Go language when multiple languages detected
- Falls back to Go if it's the only language available
- Validates code structure and content

### Data Validation

All captured data is validated:
- Problem name: 1-300 characters
- Submission link: Valid LeetCode URL
- Code: 1-100,000 characters with valid structure
- Language: Valid programming language string
- Problem set info: Title (2-200 chars), Name (2-100 chars)

### Storage

Uses Chrome's `chrome.storage.local` API:
- Problem set info stored separately
- Each problem stored with unique ID
- Supports reordering, editing, and deletion
- Persistent across browser sessions

## Development Status

✅ **Completed** - All core features implemented and tested

## Requirements

- Chrome browser (Manifest V3 compatible)
- Internet connection (for docx library CDN)

## Known Limitations

- Only works on LeetCode submission pages
- Requires page to be fully loaded before capture
- Maximum 100,000 characters per code submission

## License

MIT
