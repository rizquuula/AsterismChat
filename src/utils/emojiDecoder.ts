/**
 * Decodes Unicode escape sequences in a string to their actual characters.
 * Handles both \uXXXX (4-digit) and \u{XXXX} (variable-length) formats.
 * 
 * @param text - The text containing Unicode escape sequences
 * @returns The decoded text with actual Unicode characters
 */
export function decodeUnicodeEscapeSequences(text: string): string {
  if (!text) return text;

  // Match \u{XXXX} format (variable-length hex, e.g., \u{1F600})
  let decoded = text.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _; // Return original if invalid
    }
  });

  // Match \uXXXX format (4-digit hex, e.g., \uD83D\uDE00)
  decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _; // Return original if invalid
    }
  });

  return decoded;
}