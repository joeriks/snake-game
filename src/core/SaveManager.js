/**
 * Save Manager
 * Handles game state persistence
 */

const SAVE_KEY = 'snake_breeder_save';
const SAVE_VERSION = '1.0.0';

export class SaveManager {
    constructor() {
        this.saveKey = SAVE_KEY;
    }

    /**
     * Save game state to localStorage
     */
    save(state) {
        try {
            const saveData = {
                version: SAVE_VERSION,
                timestamp: Date.now(),
                state
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('💾 Game saved');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    /**
     * Load game state from localStorage
     */
    load() {
        try {
            const raw = localStorage.getItem(this.saveKey);
            if (!raw) return null;

            const saveData = JSON.parse(raw);

            // Version check for future migrations
            if (saveData.version !== SAVE_VERSION) {
                console.warn('Save version mismatch, may need migration');
                return this.migrate(saveData);
            }

            console.log('💾 Game loaded from', new Date(saveData.timestamp).toLocaleString());
            return saveData.state;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    /**
     * Delete save data
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('🗑️ Save deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * Check if save exists
     */
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * Migrate old save format to current version
     * TODO: Implement actual migration logic when save format changes
     */
    migrate(saveData) {
        console.log('Migrating save from version', saveData.version, 'to', SAVE_VERSION);

        // TODO: Add version-specific migrations here, e.g.:
        // if (saveData.version === '0.9.0') {
        //     saveData.state = this.migrateFrom090(saveData.state);
        //     saveData.version = '1.0.0';
        // }

        // Re-save with updated version after migration
        const migratedState = saveData.state;
        this.save(migratedState);

        return migratedState;
    }

    /**
     * Export save as downloadable file
     */
    exportSave() {
        const raw = localStorage.getItem(this.saveKey);
        if (!raw) {
            console.warn('No save to export');
            return;
        }

        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `snake_breeder_save_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Import save from file
     */
    async importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    localStorage.setItem(this.saveKey, JSON.stringify(saveData));
                    console.log('💾 Save imported');
                    resolve(saveData.state);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}
