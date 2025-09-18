import { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/image-utils';

/**
 * Custom hook for handling proxied image loading
 * @param {string} originalUrl - The original image URL
 * @returns {Object} - Image state and handlers
 */
export function useProxiedImage(originalUrl) {
  const [proxiedUrl, setProxiedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    
    try {
      const url = getOptimizedImageUrl(originalUrl);
      setProxiedUrl(url);
    } catch (error) {
      console.error('Error processing image URL:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [originalUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return {
    proxiedUrl,
    isLoading,
    hasError,
    handleImageLoad,
    handleImageError,
  };
}

/**
 * Custom hook for preloading multiple images
 * @param {Array<string>} urls - Array of image URLs to preload
 * @returns {Object} - Preloading state
 */
export function useImagePreloader(urls = []) {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (!urls.length) return;

    setIsPreloading(true);
    const promises = urls.map(url => {
      return new Promise((resolve) => {
        if (!url) {
          resolve({ url, success: false });
          return;
        }

        const proxiedUrl = getOptimizedImageUrl(url);
        const img = new Image();
        
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, url]));
          resolve({ url, success: true });
        };
        
        img.onerror = () => {
          setFailedImages(prev => new Set([...prev, url]));
          resolve({ url, success: false });
        };
        
        img.src = proxiedUrl;
      });
    });

    Promise.all(promises).then(() => {
      setIsPreloading(false);
    });
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isPreloading,
    isImageLoaded: (url) => loadedImages.has(url),
    isImageFailed: (url) => failedImages.has(url),
  };
}