let audio = null;

// Handle messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Audio page received message:', message);

    try {
        switch (message.action) {
            case 'playSound':
                handlePlaySound(message.soundUrl);
                sendResponse({ success: true });
                break;

            case 'stopSound':
                handleStopSound();
                sendResponse({ success: true });
                break;

            default:
                console.log('Unknown action:', message.action);
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error in audio page:', error);
        sendResponse({ error: error.message });
    }
});

// Play sound
function handlePlaySound(soundUrl) {
    try {
        handleStopSound();

        audio = new Audio(soundUrl);
        
        audio.onended = () => {
            chrome.runtime.sendMessage({
                type: 'soundComplete'
            });
        };

        audio.onerror = (error) => {
            console.error('Audio error:', error);
            chrome.runtime.sendMessage({
                type: 'soundError',
                error: 'Failed to play sound'
            });
        };

        audio.play().catch(error => {
            console.error('Play error:', error);
            chrome.runtime.sendMessage({
                type: 'soundError',
                error: error.message
            });
        });
    } catch (error) {
        console.error('Error playing sound:', error);
        throw error;
    }
}

// Stop sound
function handleStopSound() {
    if (audio) {
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (error) {
            console.error('Error stopping sound:', error);
        }
        audio = null;
    }
}

console.log('Audio page ready');
