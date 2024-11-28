// Initialize sound manager for custom sounds
const soundManager = new SoundManager();

// Function to check if background script is ready
async function checkBackgroundConnection() {
    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'ping' }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        return response && response.status === 'pong';
    } catch (error) {
        console.error('Connection check failed:', error);
        return false;
    }
}

// Function to retry connection
async function waitForBackground(maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Attempt ${attempt} to connect to background...`);
        const isConnected = await checkBackgroundConnection();
        if (isConnected) {
            console.log('Successfully connected to background!');
            return true;
        }
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.error(`Failed to connect after ${maxAttempts} attempts`);
    return false;
}

// Resume audio context
async function resumeAudioContext() {
    try {
        await chrome.runtime.sendMessage({ action: 'resumeAudioContext' });
    } catch (error) {
        console.error('Failed to resume audio context:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Wait for background connection
    const isConnected = await waitForBackground();
    if (!isConnected) {
        console.error('Failed to connect to background script');
        return;
    }

    // Resume audio context
    await resumeAudioContext();

    // Load custom sounds when popup opens
    const customSounds = await soundManager.loadCustomSounds();
    
    // Display all custom sounds
    const soundGrid = document.querySelector('.sound-grid');
    for (const [soundId, soundData] of Object.entries(customSounds)) {
        const soundCard = createSoundCard(soundId, soundData.name);
        soundGrid.appendChild(soundCard);
    }

    // Get current playback status
    chrome.runtime.sendMessage({ action: 'getStatus' }, (status) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting status:', chrome.runtime.lastError);
            return;
        }
        if (status) {
            updatePlaybackStatus(status);
        }
    });

    // Add click handlers for all play buttons
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.stopPropagation();
            const soundType = this.getAttribute('data-sound');
            if (soundType) {
                try {
                    // Update button state
                    const icon = this.querySelector('.material-icons');
                    if (icon) icon.textContent = 'stop';
                    
                    // Play sound through background
                    chrome.runtime.sendMessage({
                        action: 'playSound',
                        soundId: soundType
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error playing sound:', chrome.runtime.lastError);
                            if (icon) icon.textContent = 'play_arrow';
                            return;
                        }
                        if (!response || !response.success) {
                            console.error('Failed to play sound:', response?.error || 'Unknown error');
                            if (icon) icon.textContent = 'play_arrow';
                        }
                    });
                } catch (error) {
                    console.error('Error playing sound:', error);
                    const icon = this.querySelector('.material-icons');
                    if (icon) icon.textContent = 'play_arrow';
                }
            }
        });
    });

    // Handle file upload
    const uploadTrigger = document.getElementById('upload-trigger');
    const fileInput = document.getElementById('sound-upload');

    uploadTrigger.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Process the uploaded file
            const { soundId, soundData } = await soundManager.processUploadedFile(file);
            
            // Save to storage
            await soundManager.saveCustomSound(soundId, soundData);

            // Create new sound card
            const soundCard = createSoundCard(soundId, soundData.name);
            document.querySelector('.sound-grid').appendChild(soundCard);

            // Clear the file input
            fileInput.value = '';
        } catch (error) {
            console.error('Error handling file upload:', error);
            alert('Failed to upload sound: ' + error.message);
        }
    });
});

// Listen for status updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'statusUpdate' && message.status) {
        updatePlaybackStatus(message.status);
    }
});

// Update UI based on playback status
function updatePlaybackStatus(status) {
    if (!status) return;

    // Update all play buttons
    document.querySelectorAll('.play-button').forEach(button => {
        const soundId = button.getAttribute('data-sound');
        const icon = button.querySelector('.material-icons');
        if (icon) {
            if (status.isPlaying && status.currentSoundId === soundId) {
                icon.textContent = 'stop';
                button.closest('.sound-card').classList.add('playing');
            } else {
                icon.textContent = 'play_arrow';
                button.closest('.sound-card').classList.remove('playing');
            }
        }
    });
}

// Helper function to create a new sound card
function createSoundCard(soundId, name) {
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.dataset.soundId = soundId;

    card.innerHTML = `
        <div class="sound-icon">
            <span class="material-icons">music_note</span>
        </div>
        <div class="sound-info">
            <div class="sound-name">${name}</div>
            <div class="sound-duration">Custom Sound</div>
        </div>
        <div class="sound-controls">
            <button class="play-button" data-sound="${soundId}">
                <span class="material-icons">play_arrow</span>
            </button>
            <button class="delete-button" data-sound="${soundId}">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `;

    // Add click handler to the play button
    const playButton = card.querySelector('.play-button');
    playButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            const icon = playButton.querySelector('.material-icons');
            if (icon) icon.textContent = 'stop';
            
            chrome.runtime.sendMessage({
                action: 'playSound',
                soundId: soundId
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error playing sound:', chrome.runtime.lastError);
                    if (icon) icon.textContent = 'play_arrow';
                    return;
                }
                if (!response || !response.success) {
                    console.error('Failed to play sound:', response?.error || 'Unknown error');
                    if (icon) icon.textContent = 'play_arrow';
                }
            });
        } catch (error) {
            console.error('Error playing sound:', error);
            const icon = playButton.querySelector('.material-icons');
            if (icon) icon.textContent = 'play_arrow';
        }
    });

    // Add click handler to the delete button
    const deleteButton = card.querySelector('.delete-button');
    deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await soundManager.deleteCustomSound(soundId);
            card.remove();
        } catch (error) {
            console.error('Error deleting sound:', error);
            alert('Failed to delete sound: ' + error.message);
        }
    });

    return card;
}
