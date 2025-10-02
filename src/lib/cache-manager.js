// Centralized cache manager for the application
class CacheManager {
  constructor() {
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    }

    // Start cleanup interval
    this.startCleanupInterval()
  }

  // Set cache item with TTL
  set(key, data, ttl = 5 * 60 * 1000) { // 5 minutes default
    const expiry = Date.now() + ttl
    this.cache.set(key, { data, expiry, created: Date.now() })
    this.stats.sets++
  }

  // Get cache item if not expired
  get(key) {
    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      return null
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return item.data
  }

  // Check if key exists and is not expired
  has(key) {
    const item = this.cache.get(key)

    if (!item) {
      return false
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Delete specific key
  delete(key) {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
    }
    return deleted
  }

  // Clear all cache
  clear() {
    const size = this.cache.size
    this.cache.clear()
    this.stats.deletes += size
    return size
  }

  // Get cache size (valid items only)
  size() {
    const now = Date.now()
    let validItems = 0

    for (const [key, item] of this.cache.entries()) {
      if (now <= item.expiry) {
        validItems++
      } else {
        // Clean up expired item
        this.cache.delete(key)
      }
    }

    return validItems
  }

  // Get all valid cache keys
  keys() {
    const now = Date.now()
    const validKeys = []

    for (const [key, item] of this.cache.entries()) {
      if (now <= item.expiry) {
        validKeys.push(key)
      } else {
        // Clean up expired item
        this.cache.delete(key)
      }
    }

    return validKeys
  }

  // Get cache statistics
  getStats() {
    return {
      ...this.stats,
      size: this.size(),
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  // Start automatic cleanup of expired items
  startCleanupInterval(interval = 60000) { // 1 minute default
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, interval)
  }

  // Manual cleanup of expired items
  cleanup() {
    const now = Date.now()
    const expiredKeys = []

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))

    return expiredKeys.length
  }

  // Stop cleanup interval
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // Cached fetch function
  async cachedFetch(key, fetcher, ttl = 5 * 60 * 1000) {
    // Check cache first
    const cachedData = this.get(key)
    if (cachedData !== null) {
      return cachedData
    }

    try {
      // Fetch fresh data
      const data = await fetcher()

      // Cache the result
      this.set(key, data, ttl)

      return data
    } catch (error) {
      console.error('Error in cachedFetch:', error)
      throw error
    }
  }

  // Batch operations for multiple keys
  async cachedBatchFetch(keyValuePairs, ttl = 5 * 60 * 1000) {
    const results = {}
    const uncachedKeys = []

    // Check which keys are cached
    for (const [key, fetcher] of keyValuePairs) {
      const cached = this.get(key)
      if (cached !== null) {
        results[key] = cached
      } else {
        uncachedKeys.push([key, fetcher])
      }
    }

    // Fetch uncached data
    if (uncachedKeys.length > 0) {
      const fetchPromises = uncachedKeys.map(async ([key, fetcher]) => {
        try {
          const data = await fetcher()
          this.set(key, data, ttl)
          return [key, data]
        } catch (error) {
          console.error(`Error fetching ${key}:`, error)
          return [key, null]
        }
      })

      const fetchedResults = await Promise.allSettled(fetchPromises)

      fetchedResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [key, data] = result.value
          results[key] = data
        }
      })
    }

    return results
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern)
    const keysToDelete = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.deletes += keysToDelete.length

    return keysToDelete.length
  }
}

// Create singleton instance
export const cacheManager = new CacheManager()

// Export class for testing or multiple instances
export { CacheManager }
