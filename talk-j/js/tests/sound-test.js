// Sound Player Test Suite
class SoundPlayerTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        this.isRunning = false;
    }

    // Test helper functions
    async assert(condition, message, details = '') {
        this.testResults.total++;
        if (condition) {
            this.testResults.passed++;
            this.testResults.details.push({
                status: 'PASS',
                message: message,
                details: details
            });
            console.log('✅ PASS:', message, details ? `\n   Details: ${details}` : '');
        } else {
            this.testResults.failed++;
            this.testResults.details.push({
                status: 'FAIL',
                message: message,
                details: details
            });
            console.error('❌ FAIL:', message, details ? `\n   Details: ${details}` : '');
        }
    }

    // Test background connection
    async testBackgroundConnection() {
        console.log('\n🔍 Testing background connection...');
        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            await this.assert(
                response && response.status === 'pong',
                'Background connection test',
                `Response: ${JSON.stringify(response)}`
            );
        } catch (error) {
            await this.assert(
                false, 
                'Background connection test',
                `Error: ${error.message}`
            );
        }
    }

    // Test audio context initialization
    async testAudioContextInit() {
        console.log('\n🔍 Testing audio context initialization...');
        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'resumeAudioContext' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            await this.assert(
                response && response.success,
                'Audio context initialization',
                `Response: ${JSON.stringify(response)}`
            );
        } catch (error) {
            await this.assert(
                false,
                'Audio context initialization',
                `Error: ${error.message}`
            );
        }
    }

    // Test system sound playback
    async testSystemSoundPlayback() {
        console.log('\n🔍 Testing system sound playback...');
        const systemSounds = ['notification', 'complete', 'alert', 'ding'];
        
        for (const soundId of systemSounds) {
            try {
                console.log(`Testing ${soundId} sound...`);
                
                // Try to play the sound
                const playResponse = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ 
                        action: 'playSound',
                        soundId: soundId
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });

                await this.assert(
                    playResponse && playResponse.success,
                    `Play ${soundId} sound`,
                    `Response: ${JSON.stringify(playResponse)}`
                );

                // Wait for a short time to let the sound play
                await new Promise(resolve => setTimeout(resolve, 500));

                // Stop the sound
                const stopResponse = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ action: 'stopSound' }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });

                await this.assert(
                    stopResponse && stopResponse.success,
                    `Stop ${soundId} sound`,
                    `Response: ${JSON.stringify(stopResponse)}`
                );

                // Wait a bit before next test
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                await this.assert(
                    false,
                    `${soundId} sound test`,
                    `Error: ${error.message}`
                );
            }
        }
    }

    // Test custom sound upload and playback
    async testCustomSoundUpload() {
        console.log('\n🔍 Testing custom sound upload and playback...');
        try {
            // Create a test audio buffer
            const sampleRate = 44100;
            const duration = 1; // 1 second
            const numSamples = sampleRate * duration;
            const audioData = new Float32Array(numSamples);
            
            // Generate a simple sine wave
            for (let i = 0; i < numSamples; i++) {
                audioData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
            }

            // Convert to WAV format
            const wavData = this.createWavFile(audioData, sampleRate);
            const blob = new Blob([wavData], { type: 'audio/wav' });
            
            // Convert to base64
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            // Generate a unique ID for the test sound
            const testSoundId = `custom-test-${Date.now()}`;

            // Store the test sound
            await chrome.storage.local.set({ [testSoundId]: dataUrl });

            // Try to play the custom sound
            const playResponse = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ 
                    action: 'playSound',
                    soundId: testSoundId
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            await this.assert(
                playResponse && playResponse.success,
                'Play custom sound',
                `Response: ${JSON.stringify(playResponse)}`
            );

            // Wait for a short time
            await new Promise(resolve => setTimeout(resolve, 500));

            // Stop the sound
            const stopResponse = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'stopSound' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            await this.assert(
                stopResponse && stopResponse.success,
                'Stop custom sound',
                `Response: ${JSON.stringify(stopResponse)}`
            );

            // Clean up - remove test sound
            await chrome.storage.local.remove(testSoundId);

        } catch (error) {
            await this.assert(
                false,
                'Custom sound test',
                `Error: ${error.message}`
            );
        }
    }

    // Helper function to create WAV file
    createWavFile(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);

        // Write audio data
        for (let i = 0; i < samples.length; i++) {
            const sample = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(44 + i * 2, sample * 32767, true);
        }

        return buffer;
    }

    // Test error handling
    async testErrorHandling() {
        console.log('\n🔍 Testing error handling...');
        try {
            // Test invalid sound ID
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ 
                    action: 'playSound',
                    soundId: 'invalid-sound-id'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            await this.assert(
                !response.success && response.error,
                'Invalid sound ID error handling',
                `Response: ${JSON.stringify(response)}`
            );

        } catch (error) {
            await this.assert(
                true,
                'Error handling test',
                `Expected error received: ${error.message}`
            );
        }
    }

    // Run all tests
    async runAllTests() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        console.log('🚀 Starting Sound Player tests...\n');
        
        try {
            await this.testBackgroundConnection();
            await this.testAudioContextInit();
            await this.testSystemSoundPlayback();
            await this.testCustomSoundUpload();
            await this.testErrorHandling();
        } catch (error) {
            console.error('Test suite error:', error);
        }

        this.isRunning = false;

        // Print test summary
        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        
        // Print detailed results
        console.log('\n📋 Detailed Results:');
        this.testResults.details.forEach(result => {
            if (result.status === 'PASS') {
                console.log(`✅ ${result.message}`);
            } else {
                console.error(`❌ ${result.message}\n   ${result.details}`);
            }
        });

        return this.testResults;
    }
}

// Auto-run tests when extension loads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTENSION_LOADED') {
        const tester = new SoundPlayerTest();
        tester.runAllTests();
    }
});
