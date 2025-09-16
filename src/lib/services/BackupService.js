import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { transactions, accounts, budgets, goals } from '../../modules/finance/stores/financeStore.js';

class BackupService {
    constructor() {
        this.isInitialized = false;
        this.backupInterval = null;
        this.settings = writable({
            enabled: true,
            frequency: 'daily', // 'hourly', 'daily', 'weekly'
            maxBackups: 30,
            encryptionEnabled: true,
            compressionEnabled: true,
            autoCleanup: true,
            lastBackup: null,
            nextBackup: null
        });

        this.backupHistory = writable([]);
        this.isBackingUp = writable(false);
        this.backupProgress = writable(0);

        // Encryption settings
        this.encryptionKey = null;
        this.compressionLevel = 6;

        // Storage keys
        this.STORAGE_PREFIX = 'nomad_backup_';
        this.SETTINGS_KEY = 'nomad_backup_settings';
        this.HISTORY_KEY = 'nomad_backup_history';
        this.ENCRYPTION_KEY = 'nomad_backup_key';
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('🔐 Initializing BackupService...');

        try {
            // Load settings and history from localStorage
            await this.loadSettings();
            await this.loadHistory();

            // Initialize encryption
            await this.initializeEncryption();

            // Start automatic backup scheduler
            this.startScheduler();

            this.isInitialized = true;
            console.log('✅ BackupService initialized successfully');

            // Perform initial backup if needed
            const settings = get(this.settings);
            if (!settings.lastBackup || this.shouldCreateBackup()) {
                setTimeout(() => this.createBackup('automatic'), 5000);
            }

        } catch (error) {
            console.error('❌ BackupService initialization failed:', error);
            throw error;
        }
    }

    async loadSettings() {
        try {
            const savedSettings = localStorage.getItem(this.SETTINGS_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings.update(current => ({ ...current, ...parsed }));
            }
        } catch (error) {
            console.warn('⚠️ Could not load backup settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = get(this.settings);
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('❌ Could not save backup settings:', error);
        }
    }

    async loadHistory() {
        try {
            const savedHistory = localStorage.getItem(this.HISTORY_KEY);
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                this.backupHistory.set(parsed);
            }
        } catch (error) {
            console.warn('⚠️ Could not load backup history:', error);
        }
    }

    async saveHistory() {
        try {
            const history = get(this.backupHistory);
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('❌ Could not save backup history:', error);
        }
    }

    async initializeEncryption() {
        try {
            // Check if encryption key exists
            let keyData = localStorage.getItem(this.ENCRYPTION_KEY);

            if (!keyData) {
                // Generate new encryption key
                const key = await window.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );

                // Export and store key
                const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
                keyData = JSON.stringify(exportedKey);
                localStorage.setItem(this.ENCRYPTION_KEY, keyData);

                console.log('🔑 New encryption key generated');
            }

            // Import the key for use
            const keyObject = JSON.parse(keyData);
            this.encryptionKey = await window.crypto.subtle.importKey(
                'jwk',
                keyObject,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );

            console.log('🔐 Encryption initialized');

        } catch (error) {
            console.error('❌ Encryption initialization failed:', error);
            // Disable encryption if it fails
            this.settings.update(s => ({ ...s, encryptionEnabled: false }));
        }
    }

    async encrypt(data) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }

        try {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encodedData = new TextEncoder().encode(JSON.stringify(data));

            const encryptedData = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encodedData
            );

            return {
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encryptedData))
            };

        } catch (error) {
            console.error('❌ Encryption failed:', error);
            throw error;
        }
    }

    async decrypt(encryptedPackage) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }

        try {
            const iv = new Uint8Array(encryptedPackage.iv);
            const encryptedData = new Uint8Array(encryptedPackage.data);

            const decryptedData = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encryptedData
            );

            const jsonString = new TextDecoder().decode(decryptedData);
            return JSON.parse(jsonString);

        } catch (error) {
            console.error('❌ Decryption failed:', error);
            throw error;
        }
    }

    async compress(data) {
        try {
            // Simple compression using JSON.stringify optimization
            // In a real implementation, you might use pako.js or similar
            const jsonString = JSON.stringify(data);

            // Basic compression by removing unnecessary whitespace
            const compressed = jsonString.replace(/\s+/g, ' ').trim();

            return {
                compressed: compressed,
                originalSize: jsonString.length,
                compressedSize: compressed.length,
                ratio: ((1 - compressed.length / jsonString.length) * 100).toFixed(2)
            };

        } catch (error) {
            console.error('❌ Compression failed:', error);
            return { compressed: JSON.stringify(data), ratio: 0 };
        }
    }

    async decompress(compressedData) {
        try {
            // For our simple compression, just parse the JSON
            return JSON.parse(compressedData.compressed);
        } catch (error) {
            console.error('❌ Decompression failed:', error);
            throw error;
        }
    }

    gatherBackupData() {
        console.log('📦 Gathering backup data...');

        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            app: 'N-OMAD Suite',
            modules: {
                finance: {
                    transactions: get(transactions),
                    accounts: get(accounts),
                    budgets: get(budgets),
                    goals: get(goals)
                },
                // Future modules can be added here
                pantry: {
                    inventory: [],
                    shoppingList: []
                },
                nutrition: {
                    recipes: [],
                    mealPlans: [],
                    analysis: {}
                }
            },
            settings: {
                backup: get(this.settings),
                app: {} // App settings when available
            },
            metadata: {
                totalTransactions: get(transactions).length,
                totalAccounts: get(accounts).length,
                totalBudgets: get(budgets).length,
                totalGoals: get(goals).length,
                backupSize: 0 // Will be calculated later
            }
        };

        console.log('📊 Backup data gathered:', {
            transactions: backupData.modules.finance.transactions.length,
            accounts: backupData.modules.finance.accounts.length,
            budgets: backupData.modules.finance.budgets.length,
            goals: backupData.modules.finance.goals.length
        });

        return backupData;
    }

    async createBackup(type = 'manual') {
        if (get(this.isBackingUp)) {
            console.log('⚠️ Backup already in progress, skipping...');
            return null;
        }

        console.log(`🚀 Creating ${type} backup...`);
        this.isBackingUp.set(true);
        this.backupProgress.set(0);

        try {
            // Step 1: Gather data (20%)
            const backupData = this.gatherBackupData();
            this.backupProgress.set(20);

            // Step 2: Compress if enabled (40%)
            let processedData = backupData;
            const settings = get(this.settings);

            if (settings.compressionEnabled) {
                console.log('🗜️ Compressing backup data...');
                const compressed = await this.compress(backupData);
                processedData = compressed;
                console.log(`📉 Compression ratio: ${compressed.ratio}%`);
            }
            this.backupProgress.set(40);

            // Step 3: Encrypt if enabled (60%)
            if (settings.encryptionEnabled && this.encryptionKey) {
                console.log('🔐 Encrypting backup data...');
                processedData = await this.encrypt(processedData);
            }
            this.backupProgress.set(60);

            // Step 4: Create backup entry (80%)
            const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const backupEntry = {
                id: backupId,
                timestamp: new Date().toISOString(),
                type: type,
                size: JSON.stringify(processedData).length,
                originalSize: JSON.stringify(backupData).length,
                compressed: settings.compressionEnabled,
                encrypted: settings.encryptionEnabled,
                metadata: backupData.metadata
            };

            // Step 5: Store backup (90%)
            const storageKey = this.STORAGE_PREFIX + backupId;
            localStorage.setItem(storageKey, JSON.stringify(processedData));
            this.backupProgress.set(90);

            // Step 6: Update history and settings (100%)
            this.backupHistory.update(history => {
                const newHistory = [backupEntry, ...history];

                // Limit history size
                if (newHistory.length > settings.maxBackups) {
                    const removed = newHistory.splice(settings.maxBackups);
                    // Clean up old backups from storage
                    removed.forEach(oldBackup => {
                        localStorage.removeItem(this.STORAGE_PREFIX + oldBackup.id);
                    });
                }

                return newHistory;
            });

            // Update settings
            this.settings.update(s => ({
                ...s,
                lastBackup: new Date().toISOString(),
                nextBackup: this.calculateNextBackup()
            }));

            // Save to localStorage
            await this.saveHistory();
            await this.saveSettings();

            this.backupProgress.set(100);
            console.log(`✅ Backup created successfully: ${backupId}`);
            console.log(`📦 Backup size: ${(backupEntry.size / 1024).toFixed(2)} KB`);

            return backupEntry;

        } catch (error) {
            console.error('❌ Backup creation failed:', error);
            throw error;
        } finally {
            this.isBackingUp.set(false);
            setTimeout(() => this.backupProgress.set(0), 2000);
        }
    }

    async restoreBackup(backupId) {
        console.log(`🔄 Restoring backup: ${backupId}`);

        try {
            // Load backup data
            const storageKey = this.STORAGE_PREFIX + backupId;
            const backupDataString = localStorage.getItem(storageKey);

            if (!backupDataString) {
                throw new Error('Backup not found');
            }

            let backupData = JSON.parse(backupDataString);

            // Decrypt if needed
            const history = get(this.backupHistory);
            const backupEntry = history.find(b => b.id === backupId);

            if (backupEntry?.encrypted && this.encryptionKey) {
                console.log('🔓 Decrypting backup...');
                backupData = await this.decrypt(backupData);
            }

            // Decompress if needed
            if (backupEntry?.compressed) {
                console.log('📈 Decompressing backup...');
                backupData = await this.decompress(backupData);
            }

            // Restore data to stores
            console.log('📥 Restoring data to stores...');

            if (backupData.modules?.finance) {
                const finance = backupData.modules.finance;

                if (finance.transactions) {
                    transactions.set(finance.transactions);
                }
                if (finance.accounts) {
                    accounts.set(finance.accounts);
                }
                if (finance.budgets) {
                    budgets.set(finance.budgets);
                }
                if (finance.goals) {
                    goals.set(finance.goals);
                }
            }

            console.log('✅ Backup restored successfully');

            // Show success notification
            this.showNotification('Backup restored successfully!', 'success');

        } catch (error) {
            console.error('❌ Backup restoration failed:', error);
            this.showNotification('Failed to restore backup', 'error');
            throw error;
        }
    }

    async deleteBackup(backupId) {
        console.log(`🗑️ Deleting backup: ${backupId}`);

        try {
            // Remove from storage
            const storageKey = this.STORAGE_PREFIX + backupId;
            localStorage.removeItem(storageKey);

            // Remove from history
            this.backupHistory.update(history =>
                history.filter(backup => backup.id !== backupId)
            );

            await this.saveHistory();
            console.log(`✅ Backup deleted: ${backupId}`);

        } catch (error) {
            console.error('❌ Failed to delete backup:', error);
            throw error;
        }
    }

    shouldCreateBackup() {
        const settings = get(this.settings);

        if (!settings.enabled || !settings.lastBackup) {
            return true;
        }

        const lastBackup = new Date(settings.lastBackup);
        const now = new Date();
        const diffMs = now - lastBackup;

        switch (settings.frequency) {
            case 'hourly':
                return diffMs > 60 * 60 * 1000; // 1 hour
            case 'daily':
                return diffMs > 24 * 60 * 60 * 1000; // 24 hours
            case 'weekly':
                return diffMs > 7 * 24 * 60 * 60 * 1000; // 7 days
            default:
                return false;
        }
    }

    calculateNextBackup() {
        const settings = get(this.settings);
        const now = new Date();

        switch (settings.frequency) {
            case 'hourly':
                return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            default:
                return null;
        }
    }

    startScheduler() {
        console.log('⏰ Starting backup scheduler...');

        // Clear existing interval
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }

        // Check every minute for backup needs
        this.backupInterval = setInterval(() => {
            const settings = get(this.settings);
            if (settings.enabled && this.shouldCreateBackup()) {
                this.createBackup('automatic');
            }
        }, 60 * 1000); // Check every minute
    }

    stopScheduler() {
        console.log('⏸️ Stopping backup scheduler...');

        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        // This will be implemented when toast notifications are available
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }

    async exportBackup(backupId) {
        console.log(`📤 Exporting backup: ${backupId}`);

        try {
            const storageKey = this.STORAGE_PREFIX + backupId;
            const backupData = localStorage.getItem(storageKey);

            if (!backupData) {
                throw new Error('Backup not found');
            }

            const history = get(this.backupHistory);
            const backupEntry = history.find(b => b.id === backupId);
            const filename = `nomad-backup-${backupEntry.timestamp.split('T')[0]}-${backupId.slice(-8)}.json`;

            // Create download
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            console.log(`✅ Backup exported: ${filename}`);

        } catch (error) {
            console.error('❌ Failed to export backup:', error);
            throw error;
        }
    }

    async importBackup(file) {
        console.log('📥 Importing backup from file...');

        try {
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const backupData = JSON.parse(e.target.result);

                        // Validate backup structure
                        if (!backupData.timestamp || !backupData.modules) {
                            throw new Error('Invalid backup file structure');
                        }

                        // Create backup entry
                        const backupId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const backupEntry = {
                            id: backupId,
                            timestamp: backupData.timestamp,
                            type: 'imported',
                            size: JSON.stringify(backupData).length,
                            originalSize: JSON.stringify(backupData).length,
                            compressed: false,
                            encrypted: false,
                            metadata: backupData.metadata || {}
                        };

                        // Store backup
                        const storageKey = this.STORAGE_PREFIX + backupId;
                        localStorage.setItem(storageKey, JSON.stringify(backupData));

                        // Update history
                        this.backupHistory.update(history => [backupEntry, ...history]);
                        await this.saveHistory();

                        console.log(`✅ Backup imported successfully: ${backupId}`);
                        resolve(backupEntry);

                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });

        } catch (error) {
            console.error('❌ Failed to import backup:', error);
            throw error;
        }
    }

    getStorageUsage() {
        try {
            let totalSize = 0;
            const backups = [];

            for (let key in localStorage) {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    const size = localStorage.getItem(key).length;
                    totalSize += size;
                    backups.push({ key, size });
                }
            }

            return {
                totalSize,
                totalBackups: backups.length,
                backups,
                formattedSize: (totalSize / 1024).toFixed(2) + ' KB'
            };

        } catch (error) {
            console.error('❌ Failed to calculate storage usage:', error);
            return { totalSize: 0, totalBackups: 0, backups: [] };
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up backup service...');

        try {
            this.stopScheduler();

            const settings = get(this.settings);
            if (settings.autoCleanup) {
                const usage = this.getStorageUsage();
                console.log(`📊 Current storage usage: ${usage.formattedSize}`);

                // Keep only the most recent backups based on maxBackups setting
                const history = get(this.backupHistory);
                if (history.length > settings.maxBackups) {
                    const toDelete = history.slice(settings.maxBackups);
                    for (const backup of toDelete) {
                        await this.deleteBackup(backup.id);
                    }
                    console.log(`🗑️ Cleaned up ${toDelete.length} old backups`);
                }
            }

            console.log('✅ Cleanup completed');

        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }

    destroy() {
        console.log('🔥 Destroying backup service...');
        this.stopScheduler();
        this.isInitialized = false;
    }
}

// Create and export singleton instance
export const backupService = new BackupService();
export default backupService;