/**
 * Decode HTML entities and clean up text content
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export function decodeHTMLEntities(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Use DOM API to decode HTML entities
  // This needs a browser environment. If running on the server, you'd need a different library.
  let decoded = text;
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    decoded = textarea.value;
  }
  
  // Handle special XML/Unicode entities that might not be caught
   // Handle special XML/Unicode entities and UTF-8 encoding issues
  const entityMap = {
    // Original entities
    '_x000D_': '',           // Carriage return
    '_x000A_': '\n',         // Line feed  
    '_x0009_': '\t',         // Tab
    '_x0020_': ' ',          // Space
    '&nbsp;': ' ',           // Non-breaking space
    '&amp;': '&',            // Ampersand
    '&lt;': '<',             // Less than
    '&gt;': '>',             // Greater than
    '&quot;': '"',           // Quotation mark
    '&#39;': "'",            // Apostrophe
    '&apos;': "'",           // Apostrophe
    '&#x27;': "'",           // Apostrophe hex
    '&#x2019;': "'",         // Right single quotation mark
    '&#x201C;': '"',         // Left double quotation mark
    '&#x201D;': '"',         // Right double quotation mark
    '&hellip;': '...',       // Horizontal ellipsis
    '&mdash;': '—',          // Em dash
    '&ndash;': '–',          // En dash
    '&rsquo;': "'",          // Right single quotation mark
    '&lsquo;': "'",          // Left single quotation mark
    '&rdquo;': '"',          // Right double quotation mark
    '&ldquo;': '"',          // Left double quotation mark
    
    // UTF-8 encoding fixes for garbled characters
    'â€"': '—',              // Em dash (UTF-8 encoding issue)
    'â€œ': '"',              // Left double quotation mark
    'â€\u009d': '"',         // Right double quotation mark
    'â€™': "'",              // Right single quotation mark
    'â€˜': "'",              // Left single quotation mark
    'â€¦': '...',            // Horizontal ellipsis
    'â€¢': '•',              // Bullet point
    'â€‹': '',               // Zero-width space (common issue)
    'Â ': ' ',               // Non-breaking space encoding issue
    'Â': '',                 // Sometimes appears alone
    'â€¯': ' ',              // Narrow no-break space
    'â€Š': ' ',              // Hair space
    'â€‰': ' ',              // Thin space
    'â€ˆ': ' ',              // Punctuation space
    'â€‡': ' ',              // Figure space
    'â€†': ' ',              // Six-per-em space
    'â€…': ' ',              // Four-per-em space
    'â€„': ' ',              // Three-per-em space
    'â€ƒ': ' ',              // Em space
    'â€‚': ' ',              // En space
    'â€': ' ',               // En quad
    'â€€': ' ',              // Em quad
    
    // Common Windows-1252 to UTF-8 conversion issues
    'Ã¡': 'á',               // á
    'Ã©': 'é',               // é
    'Ã­': 'í',               // í
    'Ã³': 'ó',               // ó
    'Ãº': 'ú',               // ú
    'Ã±': 'ñ',               // ñ
    'Ã¼': 'ü',               // ü
    'Ã¶': 'ö',               // ö
    'Ã¤': 'ä',               // ä
    'Ã ': 'à',               // à
    'Ã¨': 'è',               // è
    'Ã¬': 'ì',               // ì
    'Ã²': 'ò',               // ò
    'Ã¹': 'ù',               // ù
    'Ã§': 'ç',               // ç
    
    // Degree and mathematical symbols
    'Â°': '°',               // Degree symbol
    'Â±': '±',               // Plus-minus sign
    'Â²': '²',               // Superscript 2
    'Â³': '³',               // Superscript 3
    'Â¼': '¼',               // One quarter
    'Â½': '½',               // One half
    'Â¾': '¾',               // Three quarters
    
    // Currency symbols
    'Â£': '£',               // Pound sign
    'Â¥': '¥',               // Yen sign
    'â‚¬': '€',              // Euro sign
    'Â¢': '¢',               // Cent sign
    
    // Other common issues
    'ï»¿': '',               // BOM (Byte Order Mark)
    '\ufeff': '',            // BOM as Unicode
    '\u00a0': ' ',           // Non-breaking space
    '\u2013': '–',           // En dash
    '\u2014': '—',           // Em dash
    '\u2018': "'",           // Left single quotation mark
    '\u2019': "'",           // Right single quotation mark
    '\u201c': '"',           // Left double quotation mark
    '\u201d': '"',           // Right double quotation mark
    '\u2026': '...',         // Horizontal ellipsis
    '\u2022': '•',           // Bullet
    '\u00b0': '°',           // Degree symbol
  };
  
  // Apply all replacements
  Object.entries(entityMap).forEach(([entity, replacement]) => {
    // Escape special regex characters in the entity string
    const escapedEntity = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedEntity, 'gi');
    decoded = decoded.replace(regex, replacement);
  });
  
  // Clean up extra whitespace and invisible characters
  decoded = decoded
    .replace(/\u200B/g, '')  // ✅ FIX: Remove zero-width spaces
    .replace(/\s+/g, ' ')    // Multiple spaces to single space
    .replace(/\n\s+/g, '\n') // Clean up line breaks
    .trim();                 // Remove leading/trailing whitespace
  
  return decoded;
}

/**
 * Clean question object by decoding all text fields
 * @param {Object} question - Question object from API
 * @returns {Object} - Cleaned question object
 */
export function cleanQuestionText(question) {
  if (!question || typeof question !== 'object') return question;
  
  const textFields = ['text', 'question_text', 'description', 'grp_type_name', 'name'];
  const cleanedQuestion = { ...question };
  
textFields.forEach(field => {
    if (cleanedQuestion[field]) {
      cleanedQuestion[field] = decodeHTMLEntities(cleanedQuestion[field]);
    }
  });
  
  return cleanedQuestion;
}