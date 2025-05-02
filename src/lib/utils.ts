/**
 * Detects the programming language from code content
 * @param code The code string to analyze
 * @returns The detected language ID for Monaco Editor
 */
export function detectLanguage(code: string): string {
  // Simplified language detection based on syntax patterns
  const lowerCode = code.toLowerCase();

  // Python detection
  if (lowerCode.includes('def ') || 
      lowerCode.includes('import ') && !lowerCode.includes(';') ||
      lowerCode.match(/^\s*#/) ||
      lowerCode.includes('self.') ||
      lowerCode.includes('print(')) {
    return 'python';
  }

  // JavaScript/TypeScript detection
  if (lowerCode.includes('function ') || 
      lowerCode.includes('=>') ||
      lowerCode.includes('const ') ||
      lowerCode.includes('let ') ||
      lowerCode.includes('var ') ||
      lowerCode.includes('interface ')) {
    // Check for TypeScript-specific syntax
    if (lowerCode.includes(': ') && 
        (lowerCode.includes('interface ') || lowerCode.includes('<') || lowerCode.includes('>'))) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Java detection
  if (lowerCode.includes('public ') || 
      lowerCode.includes('private ') ||
      lowerCode.includes('class ') && lowerCode.includes('{') ||
      lowerCode.includes('void ')) {
    return 'java';
  }

  // C/C++ detection
  if (lowerCode.includes('#include') || 
      lowerCode.includes('int main') ||
      lowerCode.includes('->') && lowerCode.includes('*')) {
    if (lowerCode.includes('cout ') || lowerCode.includes('::')) {
      return 'cpp';
    }
    return 'c';
  }

  // Go detection
  if (lowerCode.includes('func ') || 
      lowerCode.includes('package ') ||
      lowerCode.includes('import (') ||
      lowerCode.includes(':= ')) {
    return 'go';
  }

  // Rust detection
  if (lowerCode.includes('fn ') || 
      lowerCode.includes('let mut ') ||
      lowerCode.includes('-> ') && lowerCode.includes('impl')) {
    return 'rust';
  }

  // Fallback to a generic language
  return 'plaintext';
} 