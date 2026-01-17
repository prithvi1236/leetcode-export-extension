/**
 * LeetCode Documentation Generator - Content Script
 * Handles extraction of submission data from LeetCode pages
 */

console.log('LeetCode Doc Generator content script loaded');

/**
 * Detects if the current page is a LeetCode submission page
 * Patterns: 
 * - /problems/{problem-slug}/submissions/{submission-id}/
 * - /submissions/detail/{submission-id}/
 * @returns {boolean} True if on a valid submission page
 */
function detectLeetCodeSubmissionPage() {
  const pattern1 = /\/problems\/[^\/]+\/submissions\/\d+/;
  const pattern2 = /\/submissions\/detail\/\d+/;
  return pattern1.test(window.location.pathname) || pattern2.test(window.location.pathname);
}

/**
 * Extracts the submission ID from the current URL
 * Examples: 
 * - /problems/minimum-bit-flips/submissions/1886581454/ -> "1886581454"
 * - /submissions/detail/1886581454/ -> "1886581454"
 * @returns {string|null} Submission ID or null if not found
 */
function extractSubmissionId() {
  const match = window.location.pathname.match(/\/submissions\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Removes line numbers from code text while preserving indentation
 * Handles various line number formats:
 * - "1 code here"
 * - "1. code here" 
 * - "  1  code here"
 * - "1|code here"
 * - "1code here" (no space between number and code)
 * @param {string} code - The code with potential line numbers
 * @returns {string} Code with line numbers removed but indentation preserved
 */
function removeLineNumbers(code) {
  if (!code || typeof code !== 'string') return code;
  
  console.log('Removing line numbers from code...');
  console.log('Original code length:', code.length);
  console.log('First 200 chars:', code.substring(0, 200));
  
  // Split into lines
  const lines = code.split('\n');
  const cleanedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Keep empty lines as-is to preserve spacing
    if (!line.trim()) {
      cleanedLines.push(line);
      continue;
    }
    
    // Check if line contains only a number (with optional spaces) - if so, skip it entirely
    const onlyNumberPattern = /^\s*\d+\s*$/;
    if (onlyNumberPattern.test(line)) {
      console.log(`Skipping line with only number: "${line}"`);
      continue; // Skip this line entirely
    }
    
    // Try to match and remove line numbers at the start of the line
    // The key insight: we need to preserve the ORIGINAL indentation that was in the code,
    // not the spaces before the line number
    
    let cleaned = false;
    
    // Pattern 1: "1 code" or "1  code" or "1     code" (number followed by spaces and code)
    // We need to detect the original indentation by analyzing the spaces after the number
    const spacePattern = /^(\s*)\d+(\s+)(.*)$/;
    const spaceMatch = line.match(spacePattern);
    if (spaceMatch) {
      const leadingSpaces = spaceMatch[1] || '';  // Spaces before line number
      const spacesAfterNumber = spaceMatch[2] || '';  // Spaces after line number
      const codePart = spaceMatch[3] || '';  // The actual code
      
      // If code part is empty or only whitespace, skip this line
      if (!codePart.trim()) {
        console.log(`Skipping line with number but no code: "${line}"`);
        continue;
      }
      
      // The original indentation is likely the spaces after the number minus one space
      // (since there's usually at least one space separating the number from code)
      let originalIndentation = '';
      if (spacesAfterNumber.length > 1) {
        // If there are multiple spaces, the extra spaces are likely original indentation
        originalIndentation = spacesAfterNumber.substring(1);
      }
      
      // Reconstruct with leading spaces (if any) + original indentation + code
      const reconstructed = leadingSpaces + originalIndentation + codePart;
      cleanedLines.push(reconstructed);
      cleaned = true;
    }
    
    // Pattern 2: "1.code" or "1. code" (number with dot)
    if (!cleaned) {
      const dotPattern = /^(\s*)\d+\.(\s*)(.*)$/;
      const dotMatch = line.match(dotPattern);
      if (dotMatch) {
        const leadingSpaces = dotMatch[1] || '';
        const spacesAfterDot = dotMatch[2] || '';
        const codePart = dotMatch[3] || '';
        
        // If code part is empty or only whitespace, skip this line
        if (!codePart.trim()) {
          console.log(`Skipping line with number and dot but no code: "${line}"`);
          continue;
        }
        
        // For dot pattern, preserve any spaces after the dot as indentation
        const reconstructed = leadingSpaces + spacesAfterDot + codePart;
        cleanedLines.push(reconstructed);
        cleaned = true;
      }
    }
    
    // Pattern 3: "1code" (number directly attached to code)
    if (!cleaned) {
      const attachedPattern = /^(\s*)\d+([a-zA-Z_${}().[\]].*)$/;
      const attachedMatch = line.match(attachedPattern);
      if (attachedMatch) {
        const leadingSpaces = attachedMatch[1] || '';
        const codePart = attachedMatch[2] || '';
        
        const reconstructed = leadingSpaces + codePart;
        cleanedLines.push(reconstructed);
        cleaned = true;
      }
    }
    
    // Pattern 4: Other separators (|, :, tab)
    if (!cleaned) {
      const separatorPatterns = [
        /^(\s*)\d+\|(\s*)(.*)$/,  // "1|code" or "1| code"
        /^(\s*)\d+:(\s*)(.*)$/,   // "1:code" or "1: code"
        /^(\s*)\d+\t+(.*)$/,      // "1\tcode"
      ];
      
      for (const pattern of separatorPatterns) {
        const match = line.match(pattern);
        if (match) {
          const leadingSpaces = match[1] || '';
          const spacesAfterSeparator = match[2] || '';
          const codePart = match[3] || match[2] || ''; // Handle tab case
          
          // If code part is empty or only whitespace, skip this line
          if (!codePart.trim()) {
            console.log(`Skipping line with number and separator but no code: "${line}"`);
            continue;
          }
          
          const reconstructed = leadingSpaces + spacesAfterSeparator + codePart;
          cleanedLines.push(reconstructed);
          cleaned = true;
          break;
        }
      }
    }
    
    // If no line number pattern matched, keep the original line
    if (!cleaned) {
      cleanedLines.push(line);
    }
  }
  
  const cleanedCode = cleanedLines.join('\n');
  console.log('Cleaned code length:', cleanedCode.length);
  console.log('First 200 chars after cleaning:', cleanedCode.substring(0, 200));
  
  return cleanedCode;
}

/**
 * Validates if the extracted code looks legitimate
 * @param {string} code - The code to validate
 * @returns {boolean} True if code appears valid
 */
function isValidCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Check if code is too short (likely corrupted)
  if (code.trim().length < 10) return false;
  
  // Check for common code patterns (at least one of these should be present in real code)
  const codePatterns = [
    /function/i,
    /class/i,
    /def /i,
    /public/i,
    /private/i,
    /return/i,
    /if\s*\(/,
    /for\s*\(/,
    /while\s*\(/,
    /\{[\s\S]*\}/,  // curly braces with content
    /\[[\s\S]*\]/,  // square brackets
    /import/i,
    /include/i,
    /#include/,
    /package/i,
    /var /,
    /let /,
    /const /,
    /=>/,  // arrow function
    /\(\s*\)/,  // empty parentheses (function calls)
    /int /,
    /void /,
    /string /,
    /bool /,
    /vector/,
    /array/i,
    /list/i,
    /map/i,
    /set/i,
  ];
  
  // If code contains at least one code pattern, it's likely valid
  const hasCodePattern = codePatterns.some(pattern => pattern.test(code));
  
  if (!hasCodePattern) {
    console.warn('No code patterns found in extracted text');
    // Don't fail validation - just warn
    // Some valid code might not match our patterns
  }
  
  // Check if it looks like ASCII art or garbage (lots of special characters, no letters)
  const letterCount = (code.match(/[a-zA-Z]/g) || []).length;
  const totalLength = code.length;
  const letterRatio = letterCount / totalLength;
  
  // Real code should have at least 10% letters (reduced from 20%)
  if (letterRatio < 0.1) {
    console.warn('Letter ratio too low:', letterRatio);
    return false;
  }
  
  return true;
}

/**
 * Validates if the language string looks legitimate
 * @param {string} language - The language to validate
 * @returns {boolean} True if language appears valid
 */
function isValidLanguage(language) {
  if (!language || typeof language !== 'string') return false;
  
  // Language should be short (< 30 chars) and contain mostly letters
  if (language.length > 30) return false;
  
  // Should not contain newlines or special characters
  if (/[\n\r\t]/.test(language)) return false;
  
  // Should contain mostly letters
  const letterCount = (language.match(/[a-zA-Z]/g) || []).length;
  return letterCount > language.length * 0.5;
}

/**
 * Removes the LeetCode problem number prefix from a problem title
 * Example: "1. Two Sum" -> "Two Sum"
 * Example: "2. Add Two Numbers" -> "Add Two Numbers"
 * @param {string} title - The problem title with potential number prefix
 * @returns {string} The cleaned title without the number prefix
 */
function removeProblemNumberPrefix(title) {
  if (!title) return title;
  
  // Match pattern: optional whitespace, digits, period, space, then the rest
  // Examples: "1. Two Sum", "  123. Problem Name  "
  const match = title.match(/^\s*\d+\.\s*(.+)$/);
  
  if (match) {
    return match[1].trim();
  }
  
  return title.trim();
}

/**
 * Maps LeetCode language codes to readable names
 * @param {string} langCode - Language code from API (e.g., "cpp", "python3")
 * @returns {string} Readable language name (e.g., "C++", "Python3")
 */
function mapLanguageCode(langCode) {
  const mapping = {
    'cpp': 'C++',
    'python': 'Python',
    'python3': 'Python3',
    'java': 'Java',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'c': 'C',
    'csharp': 'C#',
    'go': 'Go',
    'rust': 'Rust',
    'kotlin': 'Kotlin',
    'swift': 'Swift',
    'ruby': 'Ruby',
    'scala': 'Scala',
    'php': 'PHP',
    'mysql': 'MySQL',
    'mssql': 'MS SQL Server',
    'oraclesql': 'Oracle SQL'
  };
  return mapping[langCode] || langCode;
}



/**
 * Fallback method: Extract submission data from DOM
 * Used when API call fails or returns corrupted data
 * @returns {Promise<Object>} Extracted data {name, code, language}
 * @throws {Error} If DOM extraction fails with descriptive error message
 */
async function extractFromDOM() {
  try {
    // Wait a bit for page to fully load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Starting DOM extraction...');
    
    // Try multiple selectors for problem name
    let problemName = null;
    const nameSelectors = [
      'a[href*="/problems/"]',
      '.text-title-large',
      'h1',
      '[data-cy="question-title"]',
      '.question-title'
    ];
    
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        problemName = element.textContent.trim();
        console.log(`Found problem name with selector "${selector}":`, problemName);
        break;
      }
    }
    
    if (!problemName) {
      throw new Error('Could not find problem name on this page. Please make sure you are on a submission detail page.');
    }
    
    // Extract code from <code class="language-*"> element
    let code = null;
    let language = 'Unknown';
    
    // Look for ALL code elements with language class
    const codeElements = document.querySelectorAll('code[class*="language-"]');
    console.log(`Found ${codeElements.length} code elements with language class`);
    
    // First pass: collect all valid candidates
    const candidates = [];
    
    for (const codeElement of codeElements) {
      // Extract language from class name (e.g., "language-cpp" -> "cpp")
      const classList = codeElement.className;
      const langMatch = classList.match(/language-(\w+)/);
      const detectedLang = langMatch && langMatch[1] ? langMatch[1].toLowerCase() : '';
      
      console.log(`Code element ${Array.from(codeElements).indexOf(codeElement) + 1}, detected language:`, detectedLang);
      
      // Check if this code element contains <p> tags (wrong code)
      const hasPTags = codeElement.querySelector('p') !== null;
      if (hasPTags) {
        console.warn('Contains <p> tags, skipping (wrong code)');
        continue;
      }
      
      // Remove line number elements before extracting text
      const cleanedElement = codeElement.cloneNode(true);
      const lineNumberElements = cleanedElement.querySelectorAll('.linenumber, .react-syntax-highlighter-line-number, [class*="line-number"]');
      console.log(`Found ${lineNumberElements.length} line number elements to remove`);
      
      // Remove all line number elements
      lineNumberElements.forEach(element => {
        console.log(`Removing line number element: "${element.textContent.trim()}"`);
        element.remove();
      });
      
      // Also remove any span elements that only contain numbers (additional safety)
      const spanElements = cleanedElement.querySelectorAll('span');
      spanElements.forEach(span => {
        const text = span.textContent.trim();
        // If span contains only a number and has styling that suggests it's a line number
        if (/^\d+$/.test(text) && (
          span.style.color === 'slategray' ||
          span.style.userSelect === 'none' ||
          span.className.includes('line') ||
          span.className.includes('number')
        )) {
          console.log(`Removing number-only span: "${text}"`);
          span.remove();
        }
      });
      
      // Get text content from cleaned element
      const rawCode = cleanedElement.textContent || cleanedElement.innerText;
      
      if (rawCode && rawCode.trim().length > 0) {
        const trimmedCode = rawCode.trim();
        
        // Check if this looks like ASCII art (lots of pipes and slashes, few alphanumeric)
        const alphanumericCount = (trimmedCode.match(/[a-zA-Z0-9]/g) || []).length;
        const alphanumericRatio = alphanumericCount / trimmedCode.length;
        
        // Skip if less than 30% alphanumeric (likely ASCII art)
        if (alphanumericRatio < 0.3) {
          console.warn('Low alphanumeric ratio, skipping this element (likely ASCII art)');
          continue;
        }
        
        // Add to candidates
        candidates.push({
          code: trimmedCode,
          language: detectedLang,
          element: codeElement
        });
      }
    }
    
    console.log(`Found ${candidates.length} valid candidate(s)`);
    
    // Second pass: select the best candidate
    if (candidates.length > 0) {
      let selectedCandidate = null;
      
      // If there are multiple candidates, prefer non-Go languages
      if (candidates.length > 1) {
        // Try to find a non-Go language
        selectedCandidate = candidates.find(c => c.language !== 'go');
        
        if (selectedCandidate) {
          console.log('Multiple languages found, selecting non-Go language:', selectedCandidate.language);
        } else {
          // All are Go, just pick the first one
          selectedCandidate = candidates[0];
          console.log('All candidates are Go language, selecting first one');
        }
      } else {
        // Only one candidate, use it (even if it's Go)
        selectedCandidate = candidates[0];
        console.log('Only one candidate found, language:', selectedCandidate.language);
      }
      
      // Set the code and language
      code = removeLineNumbers(selectedCandidate.code);
      language = mapLanguageCode(selectedCandidate.language);
      console.log('Selected language:', language);
      console.log('Code length after line number removal:', code.length);
      console.log('Code preview after cleaning:', code.substring(0, 100));
    }
    
    // If we still don't have code after checking language-* elements, try other selectors
    if (!code) {
      const codeSelectors = [
        '.view-lines',  // Monaco editor
        '.monaco-editor .view-lines',
        'pre code',
        '[class*="code-container"]',
        '[class*="CodeMirror"]',
        'pre',
        '[data-mode-id]'
      ];
      
      for (const selector of codeSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          // Clone and clean line numbers from this element too
          const cleanedElement = element.cloneNode(true);
          const lineNumberElements = cleanedElement.querySelectorAll('.linenumber, .react-syntax-highlighter-line-number, [class*="line-number"]');
          lineNumberElements.forEach(el => el.remove());
          
          const rawCode = cleanedElement.textContent.trim();
          code = removeLineNumbers(rawCode);
          console.log(`Found code with selector "${selector}", length after cleaning:`, code.length);
          
          // Validate the extracted code
          if (isValidCode(code)) {
            console.log('Code validation passed');
            break;
          } else {
            console.log('Code validation failed, trying next selector');
            code = null;
          }
        }
      }
    }
    
    if (!code) {
      throw new Error('Could not extract valid code from this page. Please make sure the submission has loaded completely.');
    }
    
    console.log('Extracted code (first 200 chars):', code.substring(0, 200));
    console.log('Code length:', code.length);
    console.log('Code validation check...');
    
    // Validate the extracted code
    if (!isValidCode(code)) {
      console.error('Code validation failed!');
      console.error('Code sample:', code.substring(0, 500));
      throw new Error('Extracted code appears to be invalid or corrupted.');
    }
    
    console.log('Code validation passed!');
    
    // If we still don't have language, try to find it from other elements
    if (language === 'Unknown') {
      const langSelectors = [
        '[class*="lang"]',
        '[data-language]',
        'select[name*="lang"]',
        '[class*="language"]',
        '.language-label'
      ];
      
      for (const selector of langSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const langText = element.textContent || element.getAttribute('data-language') || element.value;
          if (langText && isValidLanguage(langText)) {
            language = langText.trim();
            console.log(`Found language with selector "${selector}":`, language);
            break;
          }
        }
      }
    }
    
    // If we still couldn't find language, try to detect from code
    if (language === 'Unknown') {
      language = detectLanguageFromCode(code);
      console.log('Detected language from code:', language);
    }
    
    return {
      name: problemName,
      code: code,
      language: language
    };
  } catch (error) {
    console.error('DOM extraction error:', error);
    
    // Provide more helpful error messages
    if (error.message.includes('problem name')) {
      throw error; // Already has a good message
    } else if (error.message.includes('code')) {
      throw error; // Already has a good message
    } else {
      throw new Error(`Failed to extract data from page: ${error.message}`);
    }
  }
}

/**
 * Attempts to detect programming language from code content
 * @param {string} code - The code to analyze
 * @returns {string} Detected language or 'Unknown'
 */
function detectLanguageFromCode(code) {
  if (!code) return 'Unknown';
  
  // Simple heuristics to detect language
  if (/^#include|using namespace std|cout|cin/.test(code)) return 'C++';
  if (/^def |^class.*:|^import /.test(code)) return 'Python';
  if (/^public class|^import java\./.test(code)) return 'Java';
  if (/^function |^const |^let |^var |=>/.test(code)) return 'JavaScript';
  if (/^fn |^impl |^use /.test(code)) return 'Rust';
  if (/^func |^package main/.test(code)) return 'Go';
  if (/^using System|^namespace /.test(code)) return 'C#';
  
  return 'Unknown';
}

/**
 * Main extraction function using DOM scraping only
 * @returns {Promise<Object>} Problem data {name, code, language, submissionLink}
 * @throws {Error} If extraction fails with descriptive error message
 */
async function extractProblemData() {
  const submissionId = extractSubmissionId();
  
  if (!submissionId) {
    throw new Error('Could not extract submission ID from URL. Please make sure you are on a submission detail page.');
  }
  
  try {
    console.log('Extracting from DOM...');
    const domData = await extractFromDOM();
    
    // Format submission link as full URL: https://leetcode.com/submissions/detail/{id}/
    const fullSubmissionLink = `https://leetcode.com/submissions/detail/${submissionId}/`;
    
    return {
      name: removeProblemNumberPrefix(domData.name),
      code: domData.code,
      language: domData.language,
      submissionLink: fullSubmissionLink
    };
  } catch (domError) {
    console.error('DOM extraction failed:', domError);
    
    // Provide a comprehensive error message
    const errorMessage = `Failed to capture problem data.\n\nError: ${domError.message}\n\nPlease make sure the page has fully loaded and try again.`;
    throw new Error(errorMessage);
  }
}

/**
 * Sends extracted problem data to the extension
 * @param {Object} data - Problem data to send
 */
function sendToExtension(data) {
  chrome.runtime.sendMessage({
    type: 'PROBLEM_DATA_EXTRACTED',
    data: data
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Data sent to extension:', response);
    }
  });
}

// Always set up message listener, regardless of page type
// This ensures the popup can always communicate with the content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  // Handle ping to verify content script is loaded
  if (message.type === 'PING') {
    console.log('Responding to PING');
    sendResponse({ success: true, message: 'Content script is ready' });
    return true;
  }
  
  if (message.type === 'EXTRACT_PROBLEM_DATA') {
    console.log('Received EXTRACT_PROBLEM_DATA message');
    
    // Check if we're on a submission page
    if (!detectLeetCodeSubmissionPage()) {
      console.error('Not on a LeetCode submission page');
      sendResponse({ 
        success: false, 
        error: 'Not on a LeetCode submission page. Please navigate to a submission page.' 
      });
      return true;
    }
    
    // Check if we can extract submission ID
    const submissionId = extractSubmissionId();
    if (!submissionId) {
      console.error('Failed to extract submission ID from URL');
      sendResponse({ 
        success: false, 
        error: 'Could not extract submission ID from URL. Make sure you are on a submission detail page.' 
      });
      return true;
    }
    
    console.log('Extracting problem data for submission ID:', submissionId);
    
    // Wait a bit for page to fully render, then extract
    setTimeout(async () => {
      try {
        const data = await extractProblemData();
        console.log('Successfully extracted problem data:', data);
        console.log('Code length:', data.code?.length);
        console.log('Code preview:', data.code?.substring(0, 100));
        sendResponse({ success: true, data: data });
      } catch (error) {
        console.error('Error extracting problem data:', error);
        sendResponse({ success: false, error: error.message });
      }
    }, 2000); // Wait 2 seconds for page to render
    
    return true; // Keep message channel open for async response
  }
  
  // Unknown message type
  console.warn('Unknown message type:', message.type);
  return false;
});

// Log initialization
console.log('Content script initialized and message listener registered');
if (detectLeetCodeSubmissionPage()) {
  const submissionId = extractSubmissionId();
  if (submissionId) {
    console.log('On LeetCode submission page with ID:', submissionId);
  } else {
    console.log('On LeetCode submission page but could not extract ID');
  }
} else {
  console.log('Not on a LeetCode submission page');
}
