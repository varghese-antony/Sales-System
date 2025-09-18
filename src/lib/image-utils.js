/**
 * Utility functions for handling product images
 */

/**
 * Extracts Google Drive file ID from URL
 * @param {string} url - The Google Drive URL
 * @returns {string|null} - File ID or null if not a valid Google Drive URL
 */
export function extractGoogleDriveId(url) {
  if (!url) return null;
  
  // Check for different Google Drive URL formats
  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /https:\/\/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Converts Google Drive URL to use the proxy endpoint with just the ID
 * @param {string} url - The original image URL
 * @returns {string} - Proxied image URL or null if no valid ID found
 */
export function getProxiedImageUrl(url) {
  if (!url) return null;
  
  const fileId = extractGoogleDriveId(url);
  if (!fileId) {
    console.warn('Could not extract Google Drive ID from URL:', url);
    return null;
  }
  
  // Use the webhook proxy endpoint with just the ID
  const proxyEndpoint = 'https://n8n.werposolutions.com/webhook/get-image';
  return `${proxyEndpoint}?id=${fileId}`;
}

/**
 * Converts Google Drive share URL to direct image URL (for use with proxy)
 * @param {string} url - The Google Drive share URL
 * @returns {string} - Direct image URL or original URL if not a Google Drive link
 */
export function convertGoogleDriveUrl(url) {
  if (!url) return null;
  
  // Check if it's a Google Drive share link
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match) {
    const fileId = match[1];
    // Convert to direct image URL
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  // Check if it's already a direct Google Drive URL
  if (url.includes('drive.google.com/uc?')) {
    return url;
  }
  
  // Return original URL if it's not a Google Drive link
  return url;
}

/**
 * Validates if an image URL is accessible through the proxy
 * @param {string} url - The original image URL
 * @returns {Promise<boolean>} - True if image is accessible
 */
export async function validateImageUrl(url) {
  if (!url) return false;
  
  try {
    const proxiedUrl = getProxiedImageUrl(url);
    if (!proxiedUrl) return false;
    
    const response = await fetch(proxiedUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image validation failed:', error);
    return false;
  }
}

/**
 * Cache for image URLs to avoid repeated proxy requests
 */
const imageUrlCache = new Map();

/**
 * Gets cached or creates new proxied image URL
 * @param {string} url - Original image URL
 * @returns {string} - Cached or new proxied image URL
 */
export function getCachedImageUrl(url) {
  if (!url) return null;
  
  if (imageUrlCache.has(url)) {
    return imageUrlCache.get(url);
  }
  
  const proxiedUrl = getOptimizedImageUrl(url);
  imageUrlCache.set(url, proxiedUrl);
  return proxiedUrl;
}

/**
 * Gets optimized image URL with proxy and fallback
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} - Proxied image URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url) return null;
  
  // Extract ID and proxy through the webhook endpoint
  return getProxiedImageUrl(url);
}

/**
 * Generates a placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Placeholder text
 * @returns {string} - Placeholder image URL
 */
export function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `)}`;
}