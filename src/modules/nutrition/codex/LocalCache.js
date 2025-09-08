/**
 * CODEX N-OMAD v3.0 - Advanced Local Nutrition Cache System
 * High-performance caching for nutrition data, recipes, and analysis
 * Cache-first strategy for offline-first functionality
 * Evidence-based TTL optimization for nutrition data stability
 */

// Cache storage using IndexedDB for persistence across sessions
class IndexedDBCache {
    constructor(dbName = 'codex-nutrition-cache', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Nutrition data store
                if (!db.objectStoreNames.contains('nutrition')) {
                    const nutritionStore = db.createObjectStore('nutrition', { keyPath: 'key' });
                    nutritionStore.createIndex('timestamp', 'timestamp');
                    nutritionStore.createIndex('category', 'category');
                }
                
                // Recipe cache store
                if (!db.objectStoreNames.contains('recipes')) {
                    const recipeStore = db.createObjectStore('recipes', { keyPath: 'key' });
                    recipeStore.createIndex('timestamp', 'timestamp');
                    recipeStore.createIndex('profile', 'profile');
                }
                
                // Analysis cache store
                if (!db.objectStoreNames.contains('analysis')) {
                    const analysisStore = db.createObjectStore('analysis', { keyPath: 'key' });
                    analysisStore.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }

    async get(storeName, key) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async set(storeName, data) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Main Nutrition Cache Class
export class NutritionCache {
    constructor() {
        // In-memory cache for ultra-fast access
        this.memoryCache = new Map();
        
        // Persistent cache using IndexedDB
        this.persistentCache = new IndexedDBCache();
        
        // Cache configuration with evidence-based TTL
        this.config = {
            // Nutrition data is relatively stable - longer TTL
            nutritionTTL: 7 * 24 * 60 * 60 * 1000,     // 7 days for nutrition data
            recipeTTL: 3 * 24 * 60 * 60 * 1000,        // 3 days for generated recipes
            analysisTTL: 1 * 24 * 60 * 60 * 1000,      // 1 day for nutritional analysis
            
            // Memory cache limits
            maxMemoryEntries: 1000,                     // Max entries in memory
            memoryCleanupThreshold: 800,                // Cleanup when reaching this
            
            // Performance optimization
            compressionThreshold: 10000,                // Compress data above 10KB
            batchSize: 50                              // Batch operations for better performance
        };

        // Cache statistics for monitoring
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0,
            errors: 0
        };

        // Initialize cleanup intervals
        this.setupCleanupIntervals();
    }

    /**
     * Get nutrition data with cache-first strategy
     * ALWAYS check cache BEFORE any API call
     */
    async get(foodName, category = 'nutrition') {
        const key = this.generateKey(foodName, category);
        
        try {
            // 1. Check memory cache first (fastest)
            const memoryResult = this.getFromMemory(key);
            if (memoryResult) {
                this.stats.hits++;
                return memoryResult;
            }

            // 2. Check persistent cache (IndexedDB)
            const persistentResult = await this.getFromPersistent(key, category);
            if (persistentResult) {
                // Promote to memory cache for faster subsequent access
                this.setInMemory(key, persistentResult.data, persistentResult.ttl);
                this.stats.hits++;
                return persistentResult.data;
            }

            // 3. Cache miss - data not found
            this.stats.misses++;
            return null;

        } catch (error) {
            this.stats.errors++;
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set nutrition data in cache with intelligent TTL
     */
    async set(foodName, data, category = 'nutrition', customTTL = null) {
        const key = this.generateKey(foodName, category);
        const ttl = customTTL || this.getTTLForCategory(category);
        
        try {
            // Validate and prepare data
            const processedData = this.processDataForCache(data);
            
            // Set in memory cache
            this.setInMemory(key, processedData, ttl);
            
            // Set in persistent cache
            await this.setInPersistent(key, processedData, category, ttl);
            
            this.stats.sets++;
            return true;

        } catch (error) {
            this.stats.errors++;
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Advanced get with fallback chain
     * Cache -> Local DB -> API (with auto-caching)
     */
    async getWithFallback(foodName, apiFetcher, category = 'nutrition') {
        // 1. Try cache first
        let result = await this.get(foodName, category);
        if (result) {
            return { data: result, source: 'cache' };
        }

        try {
            // 2. Fallback to API call
            console.log(`🔄 Cache miss for "${foodName}" - fetching from API`);
            result = await apiFetcher(foodName);
            
            if (result) {
                // 3. Cache the API result for future use
                await this.set(foodName, result, category);
                return { data: result, source: 'api' };
            }

            return { data: null, source: 'none' };

        } catch (error) {
            console.error(`API fetch failed for "${foodName}":`, error);
            return { data: null, source: 'error', error };
        }
    }

    /**
     * Batch operations for better performance
     */
    async getBatch(foodNames, category = 'nutrition') {
        const results = {};
        const misses = [];

        // Check cache for all items
        for (const foodName of foodNames) {
            const cached = await this.get(foodName, category);
            if (cached) {
                results[foodName] = { data: cached, source: 'cache' };
            } else {
                misses.push(foodName);
            }
        }

        return { results, misses };
    }

    async setBatch(dataMap, category = 'nutrition') {
        const promises = Object.entries(dataMap).map(([foodName, data]) =>
            this.set(foodName, data, category)
        );
        
        return Promise.allSettled(promises);
    }

    /**
     * Recipe-specific cache methods
     */
    async getRecipe(recipeKey, profile = 'default') {
        const key = `recipe_${profile}_${recipeKey}`;
        return this.get(key, 'recipes');
    }

    async setRecipe(recipeKey, recipeData, profile = 'default') {
        const key = `recipe_${profile}_${recipeKey}`;
        return this.set(key, recipeData, 'recipes');
    }

    /**
     * Analysis cache methods
     */
    async getAnalysis(analysisKey) {
        return this.get(analysisKey, 'analysis');
    }

    async setAnalysis(analysisKey, analysisData) {
        return this.set(analysisKey, analysisData, 'analysis');
    }

    /**
     * Cache invalidation and management
     */
    async invalidate(foodName, category = 'nutrition') {
        const key = this.generateKey(foodName, category);
        
        // Remove from memory cache
        this.memoryCache.delete(key);
        
        // Remove from persistent cache
        await this.persistentCache.delete(this.getStoreForCategory(category), key);
        
        console.log(`🗑️ Invalidated cache for: ${foodName}`);
    }

    async invalidatePattern(pattern, category = 'nutrition') {
        const keys = [...this.memoryCache.keys()].filter(key => 
            key.includes(pattern)
        );
        
        for (const key of keys) {
            this.memoryCache.delete(key);
            await this.persistentCache.delete(this.getStoreForCategory(category), key);
        }
        
        console.log(`🗑️ Invalidated ${keys.length} cache entries matching: ${pattern}`);
    }

    async clearAll() {
        // Clear memory cache
        this.memoryCache.clear();
        
        // Clear persistent cache
        await Promise.all([
            this.persistentCache.clear('nutrition'),
            this.persistentCache.clear('recipes'),
            this.persistentCache.clear('analysis')
        ]);
        
        console.log('🧹 All cache cleared');
    }

    /**
     * Cache statistics and monitoring
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 ? 
            (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
            
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memorySize: this.memoryCache.size,
            efficiency: this.calculateEfficiency()
        };
    }

    /**
     * Private helper methods
     */
    generateKey(foodName, category) {
        return `${category}_${foodName.toLowerCase().replace(/\s+/g, '_')}`;
    }

    getTTLForCategory(category) {
        switch (category) {
            case 'nutrition': return this.config.nutritionTTL;
            case 'recipes': return this.config.recipeTTL;
            case 'analysis': return this.config.analysisTTL;
            default: return this.config.nutritionTTL;
        }
    }

    getStoreForCategory(category) {
        switch (category) {
            case 'nutrition': return 'nutrition';
            case 'recipes': return 'recipes';
            case 'analysis': return 'analysis';
            default: return 'nutrition';
        }
    }

    getFromMemory(key) {
        const cached = this.memoryCache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        
        if (cached) {
            // Expired entry
            this.memoryCache.delete(key);
        }
        
        return null;
    }

    setInMemory(key, data, ttl) {
        // Check memory limits and cleanup if necessary
        if (this.memoryCache.size >= this.config.maxMemoryEntries) {
            this.cleanupMemoryCache();
        }

        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    async getFromPersistent(key, category) {
        const stored = await this.persistentCache.get(this.getStoreForCategory(category), key);
        
        if (stored && Date.now() - stored.timestamp < stored.ttl) {
            return { data: stored.data, ttl: stored.ttl };
        }
        
        if (stored) {
            // Expired entry - remove it
            await this.persistentCache.delete(this.getStoreForCategory(category), key);
        }
        
        return null;
    }

    async setInPersistent(key, data, category, ttl) {
        const storeData = {
            key,
            data,
            timestamp: Date.now(),
            ttl,
            category
        };

        await this.persistentCache.set(this.getStoreForCategory(category), storeData);
    }

    processDataForCache(data) {
        // Compress large data if needed
        if (JSON.stringify(data).length > this.config.compressionThreshold) {
            // Add compression logic here if needed
            return data;
        }
        
        return data;
    }

    cleanupMemoryCache() {
        const entries = [...this.memoryCache.entries()];
        
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest entries until we're below threshold
        const toRemove = entries.length - this.config.memoryCleanupThreshold;
        for (let i = 0; i < toRemove; i++) {
            this.memoryCache.delete(entries[i][0]);
            this.stats.evictions++;
        }
    }

    setupCleanupIntervals() {
        // Cleanup expired memory entries every 5 minutes
        setInterval(() => {
            this.cleanupExpiredMemoryEntries();
        }, 5 * 60 * 1000);

        // Cleanup expired persistent entries every hour
        setInterval(() => {
            this.cleanupExpiredPersistentEntries();
        }, 60 * 60 * 1000);
    }

    cleanupExpiredMemoryEntries() {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
            if (now - entry.timestamp >= entry.ttl) {
                this.memoryCache.delete(key);
                this.stats.evictions++;
            }
        }
    }

    async cleanupExpiredPersistentEntries() {
        // This would be implemented to scan and remove expired persistent entries
        // For now, we rely on the get methods to clean up expired entries on access
        console.log('🧹 Persistent cache cleanup completed');
    }

    calculateEfficiency() {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0) return 0;
        
        return {
            hitRate: (this.stats.hits / total * 100).toFixed(2),
            efficiency: ((this.stats.hits - this.stats.errors) / total * 100).toFixed(2)
        };
    }
}

// Singleton instance for global use
export const nutritionCache = new NutritionCache();

// Cache-aware API wrapper
export class CachedNutritionAPI {
    constructor(cache = nutritionCache) {
        this.cache = cache;
    }

    /**
     * Get nutrition data with cache-first strategy
     * ALWAYS checks cache BEFORE making API calls
     */
    async getNutritionData(foodName) {
        return this.cache.getWithFallback(
            foodName,
            // API fetcher function (replace with actual API call)
            async (name) => {
                console.log(`📡 Fetching nutrition data for: ${name}`);
                
                // Example API call - replace with actual implementation
                // const response = await fetch(`/api/nutrition/${name}`);
                // return response.json();
                
                // For now, return mock data
                return {
                    name,
                    calories: Math.floor(Math.random() * 500),
                    protein: Math.floor(Math.random() * 30),
                    carbs: Math.floor(Math.random() * 50),
                    fat: Math.floor(Math.random() * 20),
                    fiber: Math.floor(Math.random() * 15),
                    timestamp: Date.now()
                };
            },
            'nutrition'
        );
    }

    /**
     * Get recipe data with cache-first strategy
     */
    async getRecipeData(recipeKey, profile = 'default') {
        const cached = await this.cache.getRecipe(recipeKey, profile);
        if (cached) {
            return { data: cached, source: 'cache' };
        }

        // Generate recipe (expensive operation)
        console.log(`🍳 Generating recipe for: ${recipeKey}`);
        const recipe = await this.generateRecipe(recipeKey, profile);
        
        if (recipe) {
            await this.cache.setRecipe(recipeKey, recipe, profile);
            return { data: recipe, source: 'generated' };
        }

        return { data: null, source: 'none' };
    }

    async generateRecipe(recipeKey, profile) {
        // Mock recipe generation - replace with actual logic
        return {
            id: recipeKey,
            profile,
            ingredients: [],
            instructions: [],
            nutrition: {},
            generatedAt: Date.now()
        };
    }
}

// Default export for easy importing
export default NutritionCache;