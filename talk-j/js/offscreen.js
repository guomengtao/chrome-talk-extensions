// 音频状态管理
const state = {
    audioContext: null,
    currentSource: null,
    isPlaying: false,
    currentSoundId: null
};

// 系统声音映射
const SOUNDS = {
    'notification': 'sounds/notification.mp3',
    'complete': 'sounds/complete.mp3',
    'alert': 'sounds/alert.mp3',
    'ding': 'sounds/ding.mp3'
};

// 初始化音频上下文
async function initAudioContext() {
    if (!state.audioContext) {
        state.audioContext = new AudioContext();
    }
    
    if (state.audioContext.state === 'suspended') {
        await state.audioContext.resume();
    }
}

// 加载音频文件
async function loadAudio(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await state.audioContext.decodeAudioData(arrayBuffer);
}

// 处理播放声音
async function handlePlaySound(soundId) {
    try {
        await initAudioContext();

        // 如果有声音在播放，先停止
        if (state.currentSource && state.isPlaying) {
            state.currentSource.stop();
        }

        // 获取声音 URL
        let soundUrl;
        if (soundId.startsWith('custom-')) {
            const result = await chrome.storage.local.get(soundId);
            if (!result[soundId]) {
                throw new Error('找不到声音文件');
            }
            soundUrl = result[soundId];
        } else {
            const soundPath = SOUNDS[soundId];
            if (!soundPath) {
                throw new Error('找不到声音文件');
            }
            soundUrl = chrome.runtime.getURL(soundPath);
        }

        // 加载并解码音频
        const audioBuffer = await loadAudio(soundUrl);

        // 创建并连接音频源
        state.currentSource = state.audioContext.createBufferSource();
        state.currentSource.buffer = audioBuffer;
        state.currentSource.connect(state.audioContext.destination);

        // 设置结束事件处理
        state.currentSource.onended = () => {
            state.isPlaying = false;
            state.currentSoundId = null;
            state.currentSource = null;
            broadcastStatus();
        };

        // 播放声音
        state.currentSource.start(0);
        state.isPlaying = true;
        state.currentSoundId = soundId;
        broadcastStatus();

        return true;
    } catch (error) {
        console.error('播放声音时出错:', error);
        state.isPlaying = false;
        state.currentSoundId = null;
        state.currentSource = null;
        broadcastStatus();
        throw error;
    }
}

// 处理停止声音
function handleStopSound() {
    if (state.currentSource && state.isPlaying) {
        try {
            state.currentSource.stop();
        } catch (error) {
            console.error('停止声音时出错:', error);
        }
        state.isPlaying = false;
        state.currentSoundId = null;
        state.currentSource = null;
        broadcastStatus();
    }
}

// 获取当前状态
function getStatus() {
    return {
        isPlaying: state.isPlaying,
        currentSoundId: state.currentSoundId
    };
}

// 广播状态更新
function broadcastStatus() {
    chrome.runtime.sendMessage({
        type: 'statusUpdate',
        status: getStatus()
    }).catch(() => {
        // 忽略发送失败的错误
    });
}

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    (async () => {
        try {
            switch (message.type) {
                case 'playSound':
                    await handlePlaySound(message.soundId);
                    sendResponse({ success: true });
                    break;

                case 'stopSound':
                    handleStopSound();
                    sendResponse({ success: true });
                    break;

                case 'resumeAudioContext':
                    await initAudioContext();
                    sendResponse({ success: true });
                    break;

                default:
                    console.warn('未知的消息类型:', message.type);
                    sendResponse({ success: false, error: '未知的消息类型' });
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    return true;
});
