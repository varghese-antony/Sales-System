import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

// Custom cache hook for client-side data caching with TTL support
export function useCache(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
  const cacheRef = useRef(new Map())
  const cleanupIntervalRef = useRef(null)
  const [, forceUpdate] = useReducer((count) => count + 1, 0)

  const set = useCallback((key, data, ttl = defaultTTL) => {
    const expiry = Date.now() + ttl
    cacheRef.current.set(key, { data, expiry })
    forceUpdate()
  }, [defaultTTL])

  const get = useCallback((key) => {
    const item = cacheRef.current.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      cacheRef.current.delete(key)
      forceUpdate()
      return null
    }

    return item.data
  }, [])

  const has = useCallback((key) => {
    const item = cacheRef.current.get(key)
    if (!item) return false

    if (Date.now() > item.expiry) {
      cacheRef.current.delete(key)
      forceUpdate()
      return false
    }

    return true
  }, [])

  const del = useCallback((key) => {
    if (cacheRef.current.delete(key)) {
      forceUpdate()
    }
  }, [])

  const clear = useCallback(() => {
    if (cacheRef.current.size > 0) {
      cacheRef.current.clear()
      forceUpdate()
    }
  }, [])

  const size = useCallback(() => {
    const now = Date.now()
    let validItems = 0
    for (const item of cacheRef.current.values()) {
      if (now <= item.expiry) {
        validItems++
      }
    }
    return validItems
  }, [])

  const keys = useCallback(() => {
    const now = Date.now()
    const validKeys = []
    for (const [key, item] of cacheRef.current.entries()) {
      if (now <= item.expiry) {
        validKeys.push(key)
      }
    }
    return validKeys
  }, [])

  const cachedFetch = useCallback(async (key, fetcher, ttl = defaultTTL) => {
    const cachedData = get(key)
    if (cachedData !== null) {
      return cachedData
    }

    try {
      const data = await fetcher()
      set(key, data, ttl)
      return data
    } catch (error) {
      console.error('Error in cachedFetch:', error)
      throw error
    }
  }, [get, set, defaultTTL])

  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now()
      let expired = false

      for (const [key, item] of cacheRef.current.entries()) {
        if (now > item.expiry) {
          cacheRef.current.delete(key)
          expired = true
        }
      }

      if (expired) {
        forceUpdate()
      }
    }, 60000)

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [])

  return useMemo(() => ({
    set,
    get,
    has,
    del,
    clear,
    size,
    keys,
    cachedFetch,
    _cache: cacheRef.current
  }), [cachedFetch, clear, del, get, has, keys, set, size])
}

// Specialized cache hook for API responses
export function useApiCache(defaultTTL = 2 * 60 * 1000) { // 2 minutes for API data
  const cache = useCache(defaultTTL)

  const cachedApiCall = useCallback(async (key, apiCall, options = {}) => {
    const {
      ttl = defaultTTL,
      retryCount = 2,
      retryDelay = 1000
    } = options

    return cache.cachedFetch(key, async () => {
      let lastError

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const result = await apiCall()
          return result
        } catch (error) {
          lastError = error

          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
          }
        }
      }

      throw lastError
    }, ttl)
  }, [cache, defaultTTL])

  return {
    ...cache,
    cachedApiCall
  }
}

// Cache hook for search results with shorter TTL
export function useSearchCache() {
  return useApiCache(30 * 1000) // 30 seconds for search results
}
