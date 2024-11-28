// Log when service worker starts
console.log('Service Worker: Started');

// Global state
const state = {
    isPlaying: false,
    currentSoundId: null,
    audioContext: null,
    currentSource: null
};

// System sounds mapping
const SOUNDS = {
    notification: 'sounds/notification.mp3',
    complete: 'sounds/complete.mp3',
    alert: 'sounds/alert.mp3',
    ding: 'sounds/ding.mp3'
};

// Initialize audio context
async function initAudioContext() {
    if (!state.audioContext) {
        state.audioContext = new AudioContext();
    }
    if (state.audioContext.state === 'suspended') {
        await state.audioContext.resume();
    }
    return state.audioContext;
}

// Load and decode audio
async function loadAudio(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await state.audioContext.decodeAudioData(arrayBuffer);
}

// Message handler
self.onmessage = (event) => {
    console.log('SW Message received:', event.data);
};

// Listen for extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Extension message received:', message);

    try {
        if (message.action === 'ping') {
            sendResponse({ status: 'pong' });
            return true;
        }

        switch (message.action) {
            case 'playSound':
                handlePlaySound(message.soundId, sendResponse);
                return true;

            case 'stopSound':
                handleStopSound(sendResponse);
                return true;

            case 'getStatus':
                sendResponse(getStatus());
                break;

            case 'resumeAudioContext':
                handleResumeAudioContext(sendResponse);
                return true;

            default:
                console.log('Unknown message action:', message.action);
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
    }
});

// Handle resuming audio context
async function handleResumeAudioContext(sendResponse) {
    try {
        await initAudioContext();
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error resuming audio context:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle playing a sound
async function handlePlaySound(soundId, sendResponse) {
    console.log('Playing sound:', soundId);
    
    // Initialize audio context
    await initAudioContext();

    // Stop current sound if playing
    handleStopSound();

    // Get sound URL
    let soundUrl;
    if (soundId.startsWith('custom-')) {
        // Handle custom sounds from storage
        const result = await chrome.storage.local.get(soundId);
        if (!result[soundId]) {
            throw new Error('Sound not found');
        }
        soundUrl = result[soundId];
    } else {
        // Handle system sounds
        const soundPath = SOUNDS[soundId];
        if (!soundPath) {
            throw new Error('Sound not found');
        }
        soundUrl = chrome.runtime.getURL(soundPath);
    }

    // Load and decode audio
    const audioBuffer = await loadAudio(soundUrl);

    // Create and connect source
    state.currentSource = state.audioContext.createBufferSource();
    state.currentSource.buffer = audioBuffer;
    state.currentSource.connect(state.audioContext.destination);

    // Set up event handlers
    state.currentSource.onended = () => {
        state.isPlaying = false;
        state.currentSoundId = null;
        state.currentSource = null;
        broadcastStatus();
    };

    // Play the sound
    state.currentSource.start(0);
    state.isPlaying = true;
    state.currentSoundId = soundId;
    broadcastStatus();
    
    sendResponse({ success: true });
}

// Handle stopping a sound
function handleStopSound(sendResponse) {
    if (state.currentSource && state.isPlaying) {
        try {
            state.currentSource.stop();
            state.currentSource.disconnect();
            state.currentSource = null;
            state.isPlaying = false;
            state.currentSoundId = null;
            broadcastStatus();
        } catch (error) {
            console.error('Error stopping sound:', error);
        }
    }
    sendResponse({ success: true });
}

// Get current status
function getStatus() {
    return {
        isPlaying: state.isPlaying,
        currentSoundId: state.currentSoundId
    };
}

// Broadcast status to all listeners
function broadcastStatus() {
    const status = getStatus();
    chrome.runtime.sendMessage({
        type: 'statusUpdate',
        status: status
    }).catch(() => {
        // Ignore errors when no listeners are available
        console.log('No listeners available for status broadcast');
    });
}

// 创建或获取 offscreen document
async function setupOffscreenDocument() {
    // 检查是否已存在
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
        return;
    }

    // 创建新的 offscreen document
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: '用于处理音频播放'
    });
}

// 初始化
chrome.runtime.onInstalled.addListener(async () => {
    await setupOffscreenDocument();
    console.log('Service Worker: Installed');
});

// 确保 offscreen document 已准备好
async function ensureOffscreenDocumentReady() {
    try {
        await setupOffscreenDocument();
        return true;
    } catch (error) {
        console.error('设置 offscreen document 失败:', error);
        return false;
    }
}

// 处理播放声音请求
async function handlePlaySoundOffscreen(soundId, sendResponse) {
    console.log('Playing sound:', soundId);
    try {
        if (!await ensureOffscreenDocumentReady()) {
            throw new Error('Offscreen document not ready');
        }

        // 发送消息到 offscreen document
        await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'playSound',
            soundId: soundId
        });

        sendResponse({ success: true });
    } catch (error) {
        console.error('Error playing sound:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true;
}

// 处理停止声音请求
async function handleStopSoundOffscreen(sendResponse) {
    try {
        if (!await ensureOffscreenDocumentReady()) {
            throw new Error('Offscreen document not ready');
        }

        // 发送消息到 offscreen document
        await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'stopSound'
        });

        sendResponse({ success: true });
    } catch (error) {
        console.error('Error stopping sound:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true;
}

// 处理恢复音频上下文请求
async function handleResumeAudioContextOffscreen(sendResponse) {
    try {
        if (!await ensureOffscreenDocumentReady()) {
            throw new Error('Offscreen document not ready');
        }

        // 发送消息到 offscreen document
        await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'resumeAudioContext'
        });

        sendResponse({ success: true });
    } catch (error) {
        console.error('Error resuming audio context:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true;
}

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Extension message received:', message);

    try {
        if (message.action === 'ping') {
            sendResponse({ status: 'pong' });
            return true;
        }

        switch (message.action) {
            case 'playSound':
                handlePlaySoundOffscreen(message.soundId, sendResponse);
                return true;

            case 'stopSound':
                handleStopSoundOffscreen(sendResponse);
                return true;

            case 'resumeAudioContext':
                handleResumeAudioContextOffscreen(sendResponse);
                return true;

            default:
                console.warn('Unknown action:', message.action);
                sendResponse({ success: false, error: 'Unknown action' });
                return true;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
        return true;
    }
});

// 当扩展加载完成时通知所有标签页
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { type: 'EXTENSION_LOADED' })
                .catch(() => {}); // 忽略无法接收消息的标签页
        });
    });
});

console.log('Service Worker: Ready');

// Keep service worker alive
self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
    console.log('Service Worker: Activated');
});
