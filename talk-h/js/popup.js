// 存储键名
const STORAGE_KEY = 'talk_h_settings';
const SOUND_KEY = 'selected_sound';

// 音效文件配置
const SOUNDS = {
    'sounds/notification.mp3': '标准提示音',
    'sounds/complete.mp3': '默认提示音',
    'sounds/alert.mp3': '警告提示音',
    'sounds/ding.mp3': '清脆提示音'
};

// 初始化设置
let settings = {
    notification: true,
    sound: true,
    selectedSound: 'sounds/complete.mp3'
};

// 音频对象
let currentAudio = null;

// 初始化提醒控制
function initAlertControls() {
    // 加载保存的设置
    chrome.storage.local.get('alertControls', ({ alertControls: saved }) => {
        if (saved) {
            Object.assign(alertControls, saved);
        }
        
        // 设置复选框状态
        const elements = {
            notification: document.getElementById('notificationToggle'),
            sound: document.getElementById('soundToggle'),
            tts: document.getElementById('ttsToggle'),
            floating: document.getElementById('floatingToggle'),
            fullscreen: document.getElementById('fullscreenToggle'),
            flash: document.getElementById('flashToggle')
        };

        // 安全地设置复选框状态
        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                element.checked = alertControls[key];
                element.addEventListener('change', e => updateControl(key, e.target.checked));
            }
        });
    });
}

// 更新控制状态
async function updateControl(name, value) {
    alertControls[name] = value;
    try {
        await chrome.storage.local.set({ alertControls });
        updateStatus('设置已保存');
    } catch (error) {
        console.error('Failed to save settings:', error);
        updateStatus('保存设置失败', true);
    }
}

// 更新状态显示
function updateStatus(message, isError = false) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.className = 'status ' + (isError ? 'error' : 'success');
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status';
        }, 3000);
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天的文章，只显示时间
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是最近7天的文章，显示星期几
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('zh-CN', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }
    
    // 其他情况显示完整日期
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// 加载文章列表
async function loadArticles() {
    try {
        console.log('Requesting articles from background script...');
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'getArticles' }, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (!response) {
                    reject(new Error('No response received'));
                    return;
                }
                resolve(response);
            });
        });

        console.log('Received response:', response);

        if (response.error) {
            throw new Error(response.error);
        }

        if (!response.articles) {
            throw new Error('Invalid response format');
        }

        const articles = response.articles;
        console.log('Rendering articles:', articles);
        renderArticles(articles);
        
        // 清除徽章
        chrome.runtime.sendMessage({ action: 'clearBadge' });
    } catch (error) {
        console.error('Failed to load articles:', error);
        document.getElementById('articleList').innerHTML = `
            <div class="error">
                Failed to load articles. Error: ${error.message}
            </div>
        `;
    }
}

// 刷新文章列表
async function refreshArticleList() {
    try {
        await loadArticles();
    } catch (error) {
        console.error('Error refreshing articles:', error);
    }
}

// 渲染文章列表
function renderArticles(articles) {
    const articleList = document.getElementById('articles');
    if (!articleList) return;

    if (!articles || articles.length === 0) {
        articleList.innerHTML = '<div class="no-articles">暂无文章</div>';
        return;
    }

    const articlesHTML = articles.map(article => `
        <div class="article ${article.priority === 'high' ? 'high-priority' : ''}" data-id="${article.id}">
            <div class="article-header">
                <h3 class="article-title">${article.title}</h3>
                ${article.priority === 'high' ? '<span class="priority-badge">重要</span>' : ''}
            </div>
            <div class="article-meta">
                <span class="article-time">${formatDate(article.created_at)}</span>
                <div class="article-actions">
                    <button class="action-button view-button" data-url="${article.url || '#'}">
                        <span class="material-icons">visibility</span>
                    </button>
                    <button class="action-button mark-read-button">
                        <span class="material-icons">check_circle</span>
                    </button>
                </div>
            </div>
            ${article.summary ? `<div class="article-summary">${article.summary}</div>` : ''}
        </div>
    `).join('');

    articleList.innerHTML = articlesHTML;

    // 添加事件监听器
    articleList.querySelectorAll('.article').forEach(articleElement => {
        const article = articles.find(a => a.id === articleElement.dataset.id);
        
        // 查看按钮
        const viewButton = articleElement.querySelector('.view-button');
        if (viewButton) {
            viewButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = article.url;
                if (url && url !== '#') {
                    chrome.tabs.create({ url });
                    markArticleAsRead(article.id);
                }
            });
        }

        // 标记已读按钮
        const markReadButton = articleElement.querySelector('.mark-read-button');
        if (markReadButton) {
            markReadButton.addEventListener('click', (e) => {
                e.stopPropagation();
                markArticleAsRead(article.id);
                articleElement.classList.add('read');
            });
        }
    });
}

// 标记文章为已读
async function markArticleAsRead(articleId) {
    try {
        await chrome.runtime.sendMessage({
            action: 'markAsRead',
            articleId: articleId
        });
        updateUnreadCount();
    } catch (error) {
        console.error('Error marking article as read:', error);
    }
}

// 更新未读数量
async function updateUnreadCount() {
    try {
        const { articles } = await chrome.runtime.sendMessage({ action: 'getArticles' });
        const unreadCount = articles.filter(article => !article.isRead).length;
        
        // 更新徽章
        chrome.action.setBadgeText({ text: unreadCount > 0 ? unreadCount.toString() : '' });
        
        // 更新统计
        updateStats({ unreadCount });
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

// 播放完成提示音
async function playCompleteSound() {
    try {
        const audio = new Audio(chrome.runtime.getURL('sounds/complete.mp3'));
        audio.volume = 0.5;  // 设置音量为50%
        await audio.play();
    } catch (error) {
        console.error('Failed to play sound:', error);
        throw error;
    }
}

// 清除未读数
function clearUnreadCount() {
    chrome.runtime.sendMessage({ action: 'clearBadge' });
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c Talk-H Plugin Loaded ', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
    console.log('Talk-H: DOM Content Loaded');
    
    // 初始化设置
    await initializeSettings();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 清除未读数
    try {
        console.log('Talk-H: Clearing Badge');
        chrome.runtime.sendMessage({ action: 'clearBadge' });
    } catch (error) {
        console.error('Talk-H: Error clearing badge:', error);
    }
    
    initSoundButtons();
    initializeStats();
});

// 初始化设置
async function initializeSettings() {
    console.log('Talk-H: Initializing Settings');
    try {
        const stored = await chrome.storage.local.get(STORAGE_KEY);
        if (stored[STORAGE_KEY]) {
            settings = { ...settings, ...stored[STORAGE_KEY] };
            // 确保选择的声音文件存在
            if (!SOUNDS.hasOwnProperty(settings.selectedSound)) {
                settings.selectedSound = 'sounds/complete.mp3';
            }
        }
        
        // 初始化控件状态
        const notificationToggle = document.getElementById('notificationToggle');
        const soundToggle = document.getElementById('soundToggle');
        const soundSelect = document.getElementById('soundSelect');
        
        if (notificationToggle) {
            notificationToggle.checked = settings.notification;
        }
        if (soundToggle) {
            soundToggle.checked = settings.sound;
        }
        if (soundSelect) {
            // 清空现有选项
            soundSelect.innerHTML = '';
            // 添加所有声音选项
            Object.entries(SOUNDS).forEach(([file, name]) => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = name;
                soundSelect.appendChild(option);
            });
            soundSelect.value = settings.selectedSound;
        }
        
        console.log('Talk-H: Settings Loaded', settings);
    } catch (error) {
        console.error('Talk-H: Settings initialization failed:', error);
        showStatus('加载设置失败', true);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 通知开关
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) {
        notificationToggle.addEventListener('change', async (e) => {
            settings.notification = e.target.checked;
            await saveSettings();
            if (e.target.checked) {
                requestNotificationPermission();
            }
        });
    }

    // 声音开关
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', async (e) => {
            settings.sound = e.target.checked;
            await saveSettings();
        });
    }

    // 声音选择
    const soundSelect = document.getElementById('soundSelect');
    if (soundSelect) {
        soundSelect.addEventListener('change', async (e) => {
            settings.selectedSound = e.target.value;
            await saveSettings();
        });
    }

    // 试听声音
    const previewSound = document.getElementById('previewSound');
    if (previewSound) {
        previewSound.addEventListener('click', () => {
            console.log('Talk-H: Playing Sound', settings.selectedSound);
            playSound(settings.selectedSound);
        });
    }

    // 测试通知
    const testNotification = document.getElementById('testNotification');
    if (testNotification) {
        testNotification.addEventListener('click', () => {
            console.log('Talk-H: Showing Test Notification');
            showTestNotification();
        });
    }

    // 显示通知预览
    const showPreview = document.getElementById('showPreview');
    const previewContainer = document.getElementById('previewContainer');
    if (showPreview && previewContainer) {
        showPreview.addEventListener('click', () => {
            previewContainer.classList.toggle('show');
        });
    }
}

// 保存设置
async function saveSettings() {
    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: settings });
        showStatus('设置已保存');
    } catch (error) {
        console.error('保存设置失败:', error);
        showStatus('保存设置失败', true);
    }
}

// 播放声音
async function playSound(soundFile) {
    try {
        // 如果有正在播放的声音，停止它
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        // 创建新的音频对象
        currentAudio = new Audio(chrome.runtime.getURL(soundFile));
        currentAudio.volume = 0.5;  // 设置音量为50%
        
        // 更新试听按钮状态
        const previewButton = document.querySelector('.preview-button');
        if (previewButton) {
            previewButton.disabled = true;
        }

        // 播放声音
        await currentAudio.play();
        
        // 监听播放结束事件
        currentAudio.addEventListener('ended', () => {
            if (previewButton) {
                previewButton.disabled = false;
            }
        });
    } catch (error) {
        console.error('Failed to play sound:', error);
        if (previewButton) {
            previewButton.disabled = false;
        }
    }
}

// 请求通知权限
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showStatus('通知权限已获取');
        } else {
            settings.notification = false;
            await saveSettings();
            showStatus('未获得通知权限', true);
        }
    } catch (error) {
        console.error('请求通知权限失败:', error);
        showStatus('请求通知权限失败', true);
    }
}

// 显示测试通知
function showTestNotification() {
    console.log('Talk-H: Showing Test Notification');
    if (!settings.notification) {
        console.log('Talk-H: Notifications are disabled');
        showStatus('请先开启通知权限', true);
        return;
    }

    const options = {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon128.png'),
        title: 'Talk-H Alert',
        message: '这是一条测试通知消息',
        buttons: [
            { title: '了解更多' },
            { title: '关闭' }
        ],
        priority: 2
    };

    chrome.notifications.create('test-notification', options, () => {
        console.log('Talk-H: Test Notification Created');
        if (settings.sound) {
            playSound(settings.selectedSound);
        }
    });
}

// 显示状态消息
function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    if (!status) return;

    status.textContent = message;
    status.className = `status ${isError ? 'error' : 'success'}`;
    setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
    }, 3000);
}

// 监听通知按钮点击
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'test-notification') {
        if (buttonIndex === 0) {
            // 了解更多按钮
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        }
        // 关闭通知
        chrome.notifications.clear(notificationId);
    }
});

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    
    if (message.action === 'playSound') {
        playCompleteSound()
            .then(() => sendResponse({ status: 'success' }))
            .catch(error => {
                console.error('Error playing sound:', error);
                sendResponse({ status: 'error', error: error.message });
            });
        return true;
    }
});

// 更新统计数据显示
function updateStats(stats) {
    const elements = {
        status: document.getElementById('status')
    };
    
    // 只在元素存在时更新
    if (elements.status) {
        elements.status.textContent = `通知: ${stats.notifications || 0} | 声音: ${stats.sounds || 0}`;
    }
}

// 初始化声音选择
function initializeSoundSelect() {
    const soundSelect = document.getElementById('soundSelect');
    if (soundSelect) {
        // 清空现有选项
        soundSelect.innerHTML = '';
        
        // 添加声音选项
        Object.entries(SOUNDS).forEach(([file, name]) => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = name;
            soundSelect.appendChild(option);
        });

        // 设置当前选中的声音
        soundSelect.value = settings.selectedSound;

        // 添加更改事件监听器
        soundSelect.addEventListener('change', async (e) => {
            settings.selectedSound = e.target.value;
            await saveSettings();
        });
    }

    // 初始化试听按钮
    const previewButton = document.querySelector('.preview-button');
    if (previewButton) {
        previewButton.addEventListener('click', () => {
            playSound(settings.selectedSound);
        });
    }
}

// 初始化声音播放按钮
function initSoundButtons() {
    const buttons = document.querySelectorAll('.play-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const soundName = button.getAttribute('data-sound');
            if (soundName) {
                playSoundEffect(soundName);
            }
        });
    });
}

// 播放声音
function playSoundEffect(soundName) {
    // 如果有正在播放的声音，停止它
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // 创建新的音频对象
    const soundFile = SOUNDS[soundName];
    if (!soundFile) {
        console.error('Sound not found:', soundName);
        return;
    }

    currentAudio = new Audio(chrome.runtime.getURL(soundFile));
    
    // 添加事件监听器来更新按钮状态
    const button = document.querySelector(`[data-sound="${soundName}"]`);
    if (button) {
        button.classList.add('playing');
        currentAudio.addEventListener('ended', () => {
            button.classList.remove('playing');
        });
    }

    // 播放声音
    currentAudio.play().catch(error => {
        console.error('Failed to play sound:', error);
        if (button) {
            button.classList.remove('playing');
        }
    });
}

// 更新提醒统计
function updateAlertStats(stats) {
    if (!stats) return;

    // 更新统计数字
    document.getElementById('totalAlerts').textContent = stats.totalAlerts || 0;
    document.getElementById('soundAlerts').textContent = stats.sounds || 0;
    document.getElementById('notificationAlerts').textContent = stats.notifications || 0;

    // 更新日志表格
    const logBody = document.getElementById('alertLogBody');
    if (!logBody) return;

    const logs = stats.alertLogs || [];
    logBody.innerHTML = logs.map(log => `
        <tr>
            <td>${formatDate(log.timestamp)}</td>
            <td>${log.articleTitle || '未知文章'}</td>
            <td>
                <div class="alert-type">
                    ${log.alertType.map(type => {
                        const icon = type === '声音' ? 'volume_up' : 'notifications';
                        return `<span class="material-icons" title="${type}">${icon}</span>`;
                    }).join('')}
                </div>
            </td>
            <td class="status-${log.status}">${log.status === 'success' ? '成功' : '失败'}</td>
        </tr>
    `).join('');
}

// 监听统计更新消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'statsUpdated') {
        updateAlertStats(message.stats);
    }
});

// 初始化时获取统计信息
async function initializeStats() {
    try {
        const { alertStats } = await chrome.storage.local.get('alertStats');
        if (alertStats) {
            updateAlertStats(alertStats);
        }
    } catch (error) {
        console.error('Error loading alert stats:', error);
    }
}