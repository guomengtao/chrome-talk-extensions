// Background Sound Manager
console.log('Background script starting...');

const audioContext = new AudioContext();
let currentSource = null;
let isPlaying = false;
let currentSoundId = null;

const systemSounds = {
    notification: 'sounds/notification.mp3',
    complete: 'sounds/complete.mp3',
    alert: 'sounds/alert.mp3',
    ding: 'sounds/ding.mp3'
};

// Cache for audio buffers
const audioBufferCache = new Map();

// Function to load and cache audio file
async function loadAudioFile(url) {
    try {
        if (audioBufferCache.has(url)) {
            return audioBufferCache.get(url);
        }

        const response = await fetch(chrome.runtime.getURL(url));
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferCache.set(url, audioBuffer);
        return audioBuffer;
    } catch (error) {
        console.error('Error loading audio file:', error);
        throw error;
    }
}

// Function to play sound
async function playSound(soundId) {
    try {
        console.log('Playing sound:', soundId);
        
        // Stop current sound if playing
        if (isPlaying && currentSource) {
            currentSource.stop();
            currentSource = null;
            isPlaying = false;
        }

        // Get sound URL
        const soundUrl = systemSounds[soundId];
        if (!soundUrl) {
            throw new Error('Sound not found');
        }

        // Load and play the audio
        const audioBuffer = await loadAudioFile(soundUrl);
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(audioContext.destination);
        
        currentSource.onended = () => {
            isPlaying = false;
            currentSoundId = null;
            broadcastStatus();
        };

        currentSource.start();
        isPlaying = true;
        currentSoundId = soundId;
        broadcastStatus();
        
        return true;
    } catch (error) {
        console.error('Error playing sound:', error);
        isPlaying = false;
        currentSoundId = null;
        broadcastStatus();
        throw error;
    }
}

// Function to stop sound
function stopSound() {
    if (currentSource && isPlaying) {
        currentSource.stop();
        currentSource = null;
        isPlaying = false;
        currentSoundId = null;
        broadcastStatus();
    }
}

// Function to get current status
function getCurrentStatus() {
    return {
        isPlaying,
        currentSoundId
    };
}

// Function to broadcast status to all connected clients
function broadcastStatus() {
    chrome.runtime.sendMessage({
        type: 'statusUpdate',
        status: getCurrentStatus()
    }).catch(() => {
        // Ignore errors when no listeners are available
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    
    if (message.action === 'playSound') {
        playSound(message.soundId)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
    
    if (message.action === 'stopSound') {
        try {
            stopSound();
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
        return false;
    }
    
    if (message.action === 'getStatus') {
        sendResponse(getCurrentStatus());
        return false;
    }
});

// Resume audio context on user interaction
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'resumeAudioContext') {
        audioContext.resume().then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
});

console.log('Background script initialized');
