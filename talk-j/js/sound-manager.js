// Sound Manager Class
class SoundManager {
    constructor() {
        this.sounds = {
            notification: 'sounds/notification.mp3',
            complete: 'sounds/complete.mp3',
            alert: 'sounds/alert.mp3',
            ding: 'sounds/ding.mp3'
        };
        this.currentAudio = null;
        this.customSounds = {};
    }

    // Load custom sounds from storage
    async loadCustomSounds() {
        try {
            const { customSounds = {} } = await chrome.storage.local.get('customSounds');
            // Convert stored base64 data back to Blob URLs
            for (const [id, sound] of Object.entries(customSounds)) {
                if (sound.data) {
                    const blob = this.base64ToBlob(sound.data, sound.type);
                    sound.url = URL.createObjectURL(blob);
                    delete sound.data; // Remove base64 data to save memory
                }
            }
            this.customSounds = customSounds;
            return customSounds;
        } catch (error) {
            console.error('Error loading custom sounds:', error);
            return {};
        }
    }

    // Convert base64 to Blob
    base64ToBlob(base64, type) {
        const byteCharacters = atob(base64);
        const byteArrays = [];
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
        return new Blob([new Uint8Array(byteArrays)], { type });
    }

    // Convert Blob to base64
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Save custom sound to storage
    async saveCustomSound(soundId, soundData) {
        try {
            // Convert Blob URL to base64 for storage
            const response = await fetch(soundData.url);
            const blob = await response.blob();
            const base64data = await this.blobToBase64(blob);
            
            const storageData = {
                ...soundData,
                data: base64data // Store as base64
            };
            delete storageData.url; // Don't store the Blob URL
            
            this.customSounds[soundId] = soundData;
            await chrome.storage.local.set({ 
                customSounds: {
                    ...this.customSounds,
                    [soundId]: storageData
                }
            });
            return true;
        } catch (error) {
            console.error('Error saving custom sound:', error);
            return false;
        }
    }

    // Delete custom sound
    async deleteCustomSound(soundId) {
        try {
            const sound = this.customSounds[soundId];
            if (sound && sound.url) {
                URL.revokeObjectURL(sound.url);
            }
            delete this.customSounds[soundId];
            await chrome.storage.local.set({ customSounds: this.customSounds });
            return true;
        } catch (error) {
            console.error('Error deleting custom sound:', error);
            return false;
        }
    }

    // Get sound URL
    getSoundUrl(soundId) {
        if (this.sounds[soundId]) {
            return chrome.runtime.getURL(this.sounds[soundId]);
        }
        return this.customSounds[soundId]?.url || null;
    }

    // Stop current playing sound
    async stopCurrentSound() {
        if (this.currentAudio) {
            try {
                await this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                
                // Remove any existing event listeners
                const oldAudio = this.currentAudio;
                this.currentAudio = null;
                
                // Use setTimeout to ensure clean garbage collection
                setTimeout(() => {
                    try {
                        oldAudio.src = '';
                        oldAudio.load();
                    } catch (e) {
                        // Ignore any errors during cleanup
                    }
                }, 100);
            } catch (error) {
                console.error('Error stopping sound:', error);
            }
        }
    }

    // Play sound
    async playSound(soundId) {
        try {
            // Stop any currently playing sound first
            await this.stopCurrentSound();

            const soundUrl = this.getSoundUrl(soundId);
            if (!soundUrl) {
                throw new Error('Sound not found');
            }

            // Create new audio instance
            const audio = new Audio(soundUrl);
            
            // Set up promise to handle both successful load and error cases
            const loadPromise = new Promise((resolve, reject) => {
                const loadHandler = () => {
                    audio.removeEventListener('canplaythrough', loadHandler);
                    audio.removeEventListener('error', errorHandler);
                    resolve();
                };
                
                const errorHandler = (error) => {
                    audio.removeEventListener('canplaythrough', loadHandler);
                    audio.removeEventListener('error', errorHandler);
                    reject(error);
                };
                
                audio.addEventListener('canplaythrough', loadHandler, { once: true });
                audio.addEventListener('error', errorHandler, { once: true });
            });

            // Load the audio
            audio.load();
            await loadPromise;

            // Only set currentAudio after successful load
            this.currentAudio = audio;

            // Set up ended event handler before playing
            audio.addEventListener('ended', () => {
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                }
            }, { once: true });

            // Start playback
            await audio.play();
            return true;
        } catch (error) {
            console.error('Error playing sound:', error);
            this.currentAudio = null;
            throw error;
        }
    }

    // Process uploaded sound file
    async processUploadedFile(file) {
        try {
            // Validate file
            if (!file.type.startsWith('audio/')) {
                throw new Error('Invalid file type');
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('File too large');
            }

            // Create object URL
            const soundId = `custom-${Date.now()}`;
            const url = URL.createObjectURL(file);
            
            // Store sound data
            const soundData = {
                name: file.name.replace(/\.[^/.]+$/, ''),
                type: file.type,
                size: file.size,
                url: url,
                uploadedAt: new Date().toISOString()
            };

            return { soundId, soundData };
        } catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    }

    // Clean up resources
    cleanup() {
        this.stopCurrentSound();
        Object.values(this.customSounds).forEach(sound => {
            if (sound.url && sound.url.startsWith('blob:')) {
                URL.revokeObjectURL(sound.url);
            }
        });
    }
}

// Export for use in popup.js
window.SoundManager = SoundManager;

// Clean up when the window unloads
window.addEventListener('unload', () => {
    if (window.soundManager) {
        window.soundManager.cleanup();
    }
});
