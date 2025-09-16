<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import backupService from '../lib/services/BackupService.js';

    // Reactive stores from BackupService
    let settings = backupService.settings;
    let backupHistory = backupService.backupHistory;
    let isBackingUp = backupService.isBackingUp;
    let backupProgress = backupService.backupProgress;

    // Component state
    let showPanel = false;
    let selectedBackup = null;
    let showConfirmDelete = false;
    let showConfirmRestore = false;
    let storageUsage = { totalSize: 0, totalBackups: 0, formattedSize: '0 KB' };
    let fileInput;

    // Load storage usage
    function updateStorageUsage() {
        storageUsage = backupService.getStorageUsage();
    }

    // Format timestamp for display
    function formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('ro-RO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Format file size
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Get backup type badge class
    function getBackupTypeBadge(type) {
        switch (type) {
            case 'automatic': return 'badge-primary';
            case 'manual': return 'badge-success';
            case 'imported': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    // Manual backup creation
    async function createManualBackup() {
        try {
            await backupService.createBackup('manual');
            updateStorageUsage();
            showNotification('Manual backup created successfully!', 'success');
        } catch (error) {
            console.error('Failed to create manual backup:', error);
            showNotification('Failed to create backup', 'error');
        }
    }

    // Backup restoration
    async function confirmRestoreBackup(backup) {
        selectedBackup = backup;
        showConfirmRestore = true;
    }

    async function restoreBackup() {
        try {
            await backupService.restoreBackup(selectedBackup.id);
            showConfirmRestore = false;
            selectedBackup = null;
            showNotification('Backup restored successfully!', 'success');
        } catch (error) {
            console.error('Failed to restore backup:', error);
            showNotification('Failed to restore backup', 'error');
        }
    }

    // Backup deletion
    async function confirmDeleteBackup(backup) {
        selectedBackup = backup;
        showConfirmDelete = true;
    }

    async function deleteBackup() {
        try {
            await backupService.deleteBackup(selectedBackup.id);
            showConfirmDelete = false;
            selectedBackup = null;
            updateStorageUsage();
            showNotification('Backup deleted successfully!', 'success');
        } catch (error) {
            console.error('Failed to delete backup:', error);
            showNotification('Failed to delete backup', 'error');
        }
    }

    // Export backup
    async function exportBackup(backupId) {
        try {
            await backupService.exportBackup(backupId);
            showNotification('Backup exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export backup:', error);
            showNotification('Failed to export backup', 'error');
        }
    }

    // Import backup
    function triggerImport() {
        fileInput.click();
    }

    async function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await backupService.importBackup(file);
            updateStorageUsage();
            showNotification('Backup imported successfully!', 'success');
            event.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Failed to import backup:', error);
            showNotification('Failed to import backup', 'error');
        }
    }

    // Update settings
    async function updateSettings() {
        try {
            await backupService.saveSettings();
            showNotification('Settings updated successfully!', 'success');

            // Restart scheduler if needed
            backupService.stopScheduler();
            backupService.startScheduler();
        } catch (error) {
            console.error('Failed to update settings:', error);
            showNotification('Failed to update settings', 'error');
        }
    }

    // Cleanup old backups
    async function cleanupBackups() {
        try {
            await backupService.cleanup();
            updateStorageUsage();
            showNotification('Cleanup completed successfully!', 'success');
        } catch (error) {
            console.error('Failed to cleanup backups:', error);
            showNotification('Failed to cleanup backups', 'error');
        }
    }

    // Notification system (simple implementation)
    let notifications = [];

    function showNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: Date.now()
        };

        notifications = [...notifications, notification];

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notifications = notifications.filter(n => n.id !== notification.id);
        }, 5000);
    }

    // Toggle panel visibility
    function togglePanel() {
        showPanel = !showPanel;
        if (showPanel) {
            updateStorageUsage();
        }
    }

    // Keyboard shortcuts
    function handleKeydown(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            togglePanel();
        }

        if (showPanel && event.code === 'Escape') {
            showPanel = false;
        }
    }

    // Initialize component
    onMount(async () => {
        console.log('🔄 BackupManager mounting...');

        try {
            if (!backupService.isInitialized) {
                await backupService.initialize();
            }
            updateStorageUsage();

            // Add keyboard listeners
            window.addEventListener('keydown', handleKeydown);

            console.log('✅ BackupManager initialized');
        } catch (error) {
            console.error('❌ BackupManager initialization failed:', error);
            showNotification('Failed to initialize backup system', 'error');
        }
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<!-- Hidden file input for imports -->
<input
    type="file"
    accept=".json"
    bind:this={fileInput}
    on:change={handleImport}
    style="display: none;"
/>

<!-- Backup Manager Toggle Button -->
<button
    class="backup-toggle-btn"
    on:click={togglePanel}
    title="Backup Manager (Ctrl+Shift+B)"
    class:active={showPanel}
>
    <span class="icon">💾</span>
    <span class="label">Backup</span>
    {#if $isBackingUp}
        <div class="backup-indicator"></div>
    {/if}
</button>

<!-- Backup Manager Panel -->
{#if showPanel}
    <div class="backup-overlay" on:click={togglePanel} transition:fade={{ duration: 200 }}></div>
    <div class="backup-panel" transition:slide={{ duration: 300, axis: 'x' }}>
        <div class="panel-header">
            <h2>💾 Backup Manager</h2>
            <button class="close-btn" on:click={togglePanel} title="Close (Escape)">×</button>
        </div>

        <div class="panel-content">
            <!-- Backup Progress -->
            {#if $isBackingUp}
                <div class="backup-progress-section" transition:slide>
                    <div class="progress-header">
                        <span class="icon">🔄</span>
                        <span>Creating backup...</span>
                    </div>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style="width: {$backupProgress}%"
                        ></div>
                    </div>
                    <div class="progress-text">{$backupProgress}%</div>
                </div>
            {/if}

            <!-- Quick Actions -->
            <div class="section">
                <h3>⚡ Quick Actions</h3>
                <div class="action-buttons">
                    <button
                        class="action-btn primary"
                        on:click={createManualBackup}
                        disabled={$isBackingUp}
                    >
                        📋 Create Backup
                    </button>
                    <button class="action-btn secondary" on:click={triggerImport}>
                        📥 Import
                    </button>
                    <button class="action-btn warning" on:click={cleanupBackups}>
                        🧹 Cleanup
                    </button>
                </div>
            </div>

            <!-- Storage Usage -->
            <div class="section">
                <h3>💽 Storage Usage</h3>
                <div class="storage-info">
                    <div class="storage-item">
                        <span class="label">Total Backups:</span>
                        <span class="value">{storageUsage.totalBackups}</span>
                    </div>
                    <div class="storage-item">
                        <span class="label">Storage Used:</span>
                        <span class="value">{storageUsage.formattedSize}</span>
                    </div>
                </div>
            </div>

            <!-- Settings -->
            <div class="section">
                <h3>⚙️ Settings</h3>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={$settings.enabled}
                                on:change={updateSettings}
                            />
                            <span class="checkmark"></span>
                            Enable Auto Backup
                        </label>
                    </div>

                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={$settings.encryptionEnabled}
                                on:change={updateSettings}
                            />
                            <span class="checkmark"></span>
                            Encryption
                        </label>
                    </div>

                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                bind:checked={$settings.compressionEnabled}
                                on:change={updateSettings}
                            />
                            <span class="checkmark"></span>
                            Compression
                        </label>
                    </div>

                    <div class="setting-item">
                        <label for="frequency">Frequency:</label>
                        <select
                            id="frequency"
                            bind:value={$settings.frequency}
                            on:change={updateSettings}
                        >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    <div class="setting-item">
                        <label for="maxBackups">Max Backups:</label>
                        <input
                            id="maxBackups"
                            type="number"
                            min="5"
                            max="100"
                            bind:value={$settings.maxBackups}
                            on:change={updateSettings}
                        />
                    </div>
                </div>
            </div>

            <!-- Backup History -->
            <div class="section">
                <h3>📋 Backup History</h3>
                <div class="backup-list">
                    {#each $backupHistory as backup (backup.id)}
                        <div class="backup-item" transition:slide>
                            <div class="backup-info">
                                <div class="backup-header">
                                    <span class="backup-timestamp">
                                        {formatTimestamp(backup.timestamp)}
                                    </span>
                                    <span class="backup-badge {getBackupTypeBadge(backup.type)}">
                                        {backup.type}
                                    </span>
                                </div>
                                <div class="backup-details">
                                    <span class="detail">
                                        📦 {formatSize(backup.size)}
                                    </span>
                                    {#if backup.encrypted}
                                        <span class="detail">🔐 Encrypted</span>
                                    {/if}
                                    {#if backup.compressed}
                                        <span class="detail">🗜️ Compressed</span>
                                    {/if}
                                    <span class="detail">
                                        📊 {backup.metadata?.totalTransactions || 0} transactions
                                    </span>
                                </div>
                            </div>
                            <div class="backup-actions">
                                <button
                                    class="action-btn small success"
                                    on:click={() => confirmRestoreBackup(backup)}
                                    title="Restore backup"
                                >
                                    🔄
                                </button>
                                <button
                                    class="action-btn small secondary"
                                    on:click={() => exportBackup(backup.id)}
                                    title="Export backup"
                                >
                                    📤
                                </button>
                                <button
                                    class="action-btn small danger"
                                    on:click={() => confirmDeleteBackup(backup)}
                                    title="Delete backup"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="empty-state">
                            <div class="empty-icon">📦</div>
                            <p>No backups created yet</p>
                            <button class="action-btn primary" on:click={createManualBackup}>
                                Create Your First Backup
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Confirmation Dialogs -->
{#if showConfirmRestore}
    <div class="modal-overlay" transition:fade>
        <div class="modal" transition:slide={{ axis: 'y' }}>
            <h3>🔄 Restore Backup</h3>
            <p>
                Are you sure you want to restore the backup from
                <strong>{formatTimestamp(selectedBackup?.timestamp)}</strong>?
            </p>
            <p class="warning">⚠️ This will overwrite all current data!</p>
            <div class="modal-actions">
                <button class="action-btn danger" on:click={restoreBackup}>
                    Restore
                </button>
                <button class="action-btn secondary" on:click={() => showConfirmRestore = false}>
                    Cancel
                </button>
            </div>
        </div>
    </div>
{/if}

{#if showConfirmDelete}
    <div class="modal-overlay" transition:fade>
        <div class="modal" transition:slide={{ axis: 'y' }}>
            <h3>🗑️ Delete Backup</h3>
            <p>
                Are you sure you want to delete the backup from
                <strong>{formatTimestamp(selectedBackup?.timestamp)}</strong>?
            </p>
            <p class="warning">⚠️ This action cannot be undone!</p>
            <div class="modal-actions">
                <button class="action-btn danger" on:click={deleteBackup}>
                    Delete
                </button>
                <button class="action-btn secondary" on:click={() => showConfirmDelete = false}>
                    Cancel
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Notifications -->
{#if notifications.length > 0}
    <div class="notifications">
        {#each notifications as notification (notification.id)}
            <div
                class="notification {notification.type}"
                transition:slide={{ axis: 'x' }}
            >
                <span class="notification-message">{notification.message}</span>
                <button
                    class="notification-close"
                    on:click={() => notifications = notifications.filter(n => n.id !== notification.id)}
                >
                    ×
                </button>
            </div>
        {/each}
    </div>
{/if}

<style>
    /* Toggle Button */
    .backup-toggle-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        transition: all 0.3s ease;
        z-index: 1000;
    }

    .backup-toggle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
    }

    .backup-toggle-btn.active {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
    }

    .backup-toggle-btn .icon {
        font-size: 1.2rem;
    }

    .backup-indicator {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    /* Panel Overlay and Panel */
    .backup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1001;
    }

    .backup-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 500px;
        height: 100vh;
        background: white;
        box-shadow: -5px 0 25px rgba(0, 0, 0, 0.2);
        z-index: 1002;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    :global(.dark-mode) .backup-panel {
        background: #1a202c;
        color: #e2e8f0;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }

    :global(.dark-mode) .panel-header {
        background: #2d3748;
        border-color: #4a5568;
    }

    .panel-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .close-btn:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    /* Panel Content */
    .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
    }

    .section {
        margin-bottom: 2rem;
    }

    .section h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .section h3 {
        color: #e2e8f0;
    }

    /* Progress Section */
    .backup-progress-section {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        border: 1px solid #3b82f6;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .progress-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-weight: 500;
        color: #1d4ed8;
    }

    .progress-bar {
        height: 8px;
        background: rgba(59, 130, 246, 0.2);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        transition: width 0.3s ease;
    }

    .progress-text {
        text-align: center;
        font-size: 0.875rem;
        font-weight: 600;
        color: #1d4ed8;
    }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .action-btn {
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .action-btn.primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .action-btn.primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .action-btn.secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
    }

    .action-btn.secondary:hover {
        background: #e5e7eb;
    }

    .action-btn.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }

    .action-btn.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }

    .action-btn.danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
    }

    .action-btn.small {
        padding: 0.5rem;
        font-size: 0.875rem;
    }

    /* Storage Info */
    .storage-info {
        display: grid;
        gap: 0.75rem;
    }

    .storage-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    :global(.dark-mode) .storage-item {
        background: #2d3748;
        border-color: #4a5568;
    }

    .storage-item .label {
        font-weight: 500;
        color: #6b7280;
    }

    :global(.dark-mode) .storage-item .label {
        color: #a0aec0;
    }

    .storage-item .value {
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .storage-item .value {
        color: #e2e8f0;
    }

    /* Settings Grid */
    .settings-grid {
        display: grid;
        gap: 1rem;
    }

    .setting-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: 500;
    }

    .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin: 0;
    }

    select, input[type="number"] {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        color: #374151;
        font-size: 0.875rem;
    }

    :global(.dark-mode) select,
    :global(.dark-mode) input[type="number"] {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }

    /* Backup List */
    .backup-list {
        max-height: 400px;
        overflow-y: auto;
    }

    .backup-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    :global(.dark-mode) .backup-item {
        background: #2d3748;
        border-color: #4a5568;
    }

    .backup-info {
        flex: 1;
    }

    .backup-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .backup-timestamp {
        font-weight: 600;
        color: #374151;
    }

    :global(.dark-mode) .backup-timestamp {
        color: #e2e8f0;
    }

    .backup-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .badge-primary {
        background: #dbeafe;
        color: #1d4ed8;
    }

    .badge-success {
        background: #d1fae5;
        color: #065f46;
    }

    .badge-warning {
        background: #fef3c7;
        color: #92400e;
    }

    .badge-secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .backup-details {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    :global(.dark-mode) .backup-details {
        color: #a0aec0;
    }

    .backup-actions {
        display: flex;
        gap: 0.5rem;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }

    .modal {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    :global(.dark-mode) .modal {
        background: #1a202c;
        color: #e2e8f0;
    }

    .modal h3 {
        margin: 0 0 1rem 0;
        color: #374151;
    }

    :global(.dark-mode) .modal h3 {
        color: #e2e8f0;
    }

    .modal p {
        margin: 0 0 1rem 0;
        color: #6b7280;
    }

    :global(.dark-mode) .modal p {
        color: #a0aec0;
    }

    .modal p.warning {
        color: #f59e0b;
        font-weight: 600;
    }

    .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
    }

    /* Notifications */
    .notifications {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 2001;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-width: 400px;
    }

    .notification {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border-left: 4px solid;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .notification.success {
        border-left-color: #10b981;
        background: #ecfdf5;
    }

    .notification.error {
        border-left-color: #ef4444;
        background: #fef2f2;
    }

    .notification.info {
        border-left-color: #3b82f6;
        background: #eff6ff;
    }

    .notification-message {
        font-weight: 500;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .backup-panel {
            width: 100%;
        }

        .backup-toggle-btn {
            top: 10px;
            right: 10px;
            padding: 0.5rem 0.75rem;
        }

        .backup-toggle-btn .label {
            display: none;
        }

        .notifications {
            left: 10px;
            right: 10px;
            top: 80px;
        }

        .action-buttons {
            flex-direction: column;
        }

        .backup-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .backup-actions {
            align-self: stretch;
            justify-content: space-between;
        }
    }
</style>