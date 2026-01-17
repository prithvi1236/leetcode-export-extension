/**
 * Document Generator Module
 * Generates .docx files from problem set data using the docx library
 */

// Make docx available globally (loaded via CDN in popup.html)
const { Document, Paragraph, TextRun, Packer } = window.docx;

/**
 * Generates a .docx document from problem set data
 * @param {Object} documentData - The document data
 * @param {Object} documentData.problemSetInfo - Problem set metadata
 * @param {string} documentData.problemSetInfo.title - Problem set title
 * @param {string} documentData.problemSetInfo.submittedBy - Student name
 * @param {Array} documentData.problems - Array of problem objects
 * @returns {Document} - docx Document instance
 */
function generateDocxDocument(documentData) {
  const { problemSetInfo, problems } = documentData;
  
  const sections = [];
  
  // Add header section
  sections.push(...createHeader(problemSetInfo));
  
  // Add each problem section
  problems.forEach((problem, index) => {
    // Add spacing before each problem (except the first one)
    if (index > 0) {
      sections.push(new Paragraph({ text: '' }));
    }
    sections.push(...createProblemSection(problem));
  });
  
  // Create and return the document
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });
  
  return doc;
}

/**
 * Creates the document header with problem set title and student name
 * @param {Object} info - Problem set info
 * @param {string} info.title - Problem set title
 * @param {string} info.submittedBy - Student name
 * @returns {Array<Paragraph>} - Array of header paragraphs
 */
function createHeader(info) {
  const paragraphs = [];
  
  // Problem set title (large, bold)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: info.title,
          bold: true,
          size: 48, // 24pt (size is in half-points)
          font: 'Arial'
        })
      ],
      spacing: {
        after: 200
      }
    })
  );
  
  // Submitted by line
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Submitted by: ${info.submittedBy}`,
          size: 24, // 12pt
          font: 'Arial'
        })
      ],
      spacing: {
        after: 200
      }
    })
  );
  
  // Add 2 blank lines after "Submitted by"
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 200 }
    })
  );
  
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 200 }
    })
  );
  
  return paragraphs;
}

/**
 * Creates a problem section with name, link, and code
 * @param {Object} problem - Problem data
 * @param {string} problem.name - Problem name
 * @param {string} problem.submissionLink - Submission URL
 * @param {string} problem.code - Code solution
 * @param {string} problem.language - Programming language
 * @returns {Array<Paragraph>} - Array of problem section paragraphs
 */
function createProblemSection(problem) {
  const paragraphs = [];
  
  // Problem name heading (bold, larger font)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: problem.name,
          bold: true,
          size: 36, // 18pt
          font: 'Arial'
        })
      ],
      spacing: {
        before: 200,
        after: 200
      }
    })
  );
  
  // Add blank line after problem name
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 100 }
    })
  );
  
  // Submission link label and URL
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Submission Link-',
          size: 24, // 12pt
          font: 'Arial'
        })
      ],
      spacing: {
        after: 100
      }
    })
  );
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: problem.submissionLink,
          size: 24, // 12pt
          font: 'Arial',
          color: '000000' // Black color
        })
      ],
      spacing: {
        after: 200
      }
    })
  );
  
  // Add blank line after submission link
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 100 }
    })
  );
  
  // Code label
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Code-',
          bold: true,
          size: 24, // 12pt
          font: 'Arial'
        })
      ],
      spacing: {
        after: 100
      }
    })
  );
  
  // Add 1 blank line between "Code-" and actual code
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { after: 100 }
    })
  );
  
  // Code block
  paragraphs.push(...formatCodeBlock(problem.code));
  
  return paragraphs;
}

/**
 * Formats code into paragraphs with monospace font and red color
 * @param {string} code - Code string
 * @returns {Array<Paragraph>} - Array of code paragraphs
 */
function formatCodeBlock(code) {
  const paragraphs = [];
  const lines = code.split('\n');
  
  lines.forEach(line => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ', // Use space for empty lines to preserve spacing
            font: 'Courier New',
            size: 20, // 10pt
            color: 'FF0000' // Red color as specified in requirements
          })
        ],
        spacing: {
          line: 240, // Single line spacing
          lineRule: 'auto'
        }
      })
    );
  });
  
  return paragraphs;
}

/**
 * Generates a filename from problem set info
 * @param {Object} problemSetInfo - Problem set metadata
 * @param {string} problemSetInfo.submittedBy - Student name
 * @param {string} problemSetInfo.title - Problem set title
 * @returns {string} - Sanitized filename with .docx extension
 */
function generateFilename(problemSetInfo) {
  const { submittedBy, title } = problemSetInfo;
  
  // Format: "Student Name - Problem Set Title.docx"
  const filename = `${submittedBy} - ${title}.docx`;
  
  // Sanitize filename by removing invalid characters
  return filename.replace(/[<>:"/\\|?*]/g, '');
}
