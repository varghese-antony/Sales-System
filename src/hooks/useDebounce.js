import { useState, useEffect } from 'react'

// Custom debounce hook to optimize search and filter inputs
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Set up the debounce timer
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clear the timeout if value changes (cleanup function)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Advanced debounce hook with immediate execution option
export function useAdvancedDebounce(value, options = {}) {
  const {
    delay = 300,
    immediate = false,
    callback = null
  } = options

  const [debouncedValue, setDebouncedValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    setIsDebouncing(true)

    // If immediate execution is requested, execute callback immediately
    if (immediate && callback) {
      callback(value)
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)

      // Execute callback when debouncing is complete
      if (callback && !immediate) {
        callback(value)
      }
    }, delay)

    return () => {
      clearTimeout(handler)
      setIsDebouncing(false)
    }
  }, [value, delay, immediate, callback])

  return {
    debouncedValue,
    isDebouncing,
    // Method to manually trigger the callback
    trigger: () => {
      if (callback) {
        callback(debouncedValue)
      }
    }
  }
}

// Debounce hook specifically for search inputs
export function useSearchDebounce(searchTerm, onSearch, delay = 300) {
  const [isSearching, setIsSearching] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [debouncedSearchTerm, searchTerm])

  useEffect(() => {
    if (debouncedSearchTerm) {
      onSearch(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, onSearch])

  return {
    isSearching,
    hasSearchTerm: Boolean(debouncedSearchTerm)
  }
}
