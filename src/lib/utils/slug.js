/**
 * Convert a URL slug to a proper product name
 * @param {string} slug - The URL slug (e.g., "led-ultra-slim-downlight")
 * @returns {string} - The proper product name (e.g., "LED Ultra Slim Downlight")
 */
export function slugToProductName(slug) {
  if (!slug) return '';
  
  // Common acronyms that should be all uppercase
  const acronyms = ['led', 'ufo', 'ip', 'ik', 'cct', 'cri', 'pir', 'usb', 'ac', 'dc'];
  
  return decodeURIComponent(slug)
    .replace(/%20/g, ' ')
    .split('-')
    .map(word => {
      const lowerWord = word.toLowerCase();
      // Check if it's an acronym
      if (acronyms.includes(lowerWord)) {
        return word.toUpperCase();
      }
      // Otherwise capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
