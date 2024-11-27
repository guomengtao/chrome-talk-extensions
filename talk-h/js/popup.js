// 提醒控制状态
const alertControls = {
    notification: true,
    sound: true,
    tts: true,
    floating: true,
    fullscreen: true,
    flash: true
};

// 初始化提醒控制
function initAlertControls() {
    // 加载保存的设置
    chrome.storage.local.get('alertControls', ({ alertControls: saved }) => {
        if (saved) {
            Object.assign(alertControls, saved);
        }
        
        // 设置复选框状态
        document.getElementById('notificationToggle').checked = alertControls.notification;
        document.getElementById('soundToggle').checked = alertControls.sound;
        document.getElementById('ttsToggle').checked = alertControls.tts;
        document.getElementById('floatingToggle').checked = alertControls.floating;
        document.getElementById('fullscreenToggle').checked = alertControls.fullscreen;
        document.getElementById('flashToggle').checked = alertControls.flash;
    });

    // 绑定事件监听器
    document.getElementById('notificationToggle').addEventListener('change', e => updateControl('notification', e.target.checked));
    document.getElementById('soundToggle').addEventListener('change', e => updateControl('sound', e.target.checked));
    document.getElementById('ttsToggle').addEventListener('change', e => updateControl('tts', e.target.checked));
    document.getElementById('floatingToggle').addEventListener('change', e => updateControl('floating', e.target.checked));
    document.getElementById('fullscreenToggle').addEventListener('change', e => updateControl('fullscreen', e.target.checked));
    document.getElementById('flashToggle').addEventListener('change', e => updateControl('flash', e.target.checked));
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
    status.textContent = message;
    status.style.color = isError ? '#dc3545' : '#666';
    setTimeout(() => {
        status.textContent = '';
    }, 2000);
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
    
    if (!articles || articles.length === 0) {
        articleList.innerHTML = '<div class="no-articles">No articles found</div>';
        return;
    }

    const articlesHTML = articles.map(article => `
        <div class="article" data-url="${article.url || '#'}">
            <div class="article-title ${article.priority === 'high' ? 'priority-high' : ''}">
                ${article.title}
            </div>
            <div class="article-meta">
                <span>${formatDate(article.created_at)}</span>
                <span>${article.priority === 'high' ? '⚠️ 重要' : '普通'}</span>
            </div>
            ${article.summary ? `<div class="article-summary">${article.summary}</div>` : ''}
        </div>
    `).join('');

    articleList.innerHTML = articlesHTML;

    // 添加点击事件
    articleList.querySelectorAll('.article').forEach(article => {
        article.addEventListener('click', () => {
            const url = article.dataset.url;
            if (url && url !== '#') {
                chrome.tabs.create({ url });
            }
        });
    });
}

// 播放完成提示音
async function playCompleteSound() {
    try {
        const audio = new Audio(chrome.runtime.getURL('assets/complete.mp3'));
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
    console.log('Popup loaded');
    
    // 清除未读数
    try {
        chrome.runtime.sendMessage({ action: 'clearBadge' });
    } catch (error) {
        console.error('Error clearing badge:', error);
    }

    const articlesContainer = document.getElementById('articles');
    const showReadCheckbox = document.getElementById('showRead');
    const refreshButton = document.getElementById('refresh');
    const lastFetchElement = document.getElementById('lastFetch');
    const totalAlertsElement = document.getElementById('totalAlerts');
    const soundAlertsElement = document.getElementById('soundAlerts');
    const notificationAlertsElement = document.getElementById('notificationAlerts');
    const alertTimesElement = document.getElementById('alertTimes');

    // Load show read preference from storage
    chrome.storage.local.get(['showRead'], (result) => {
        showReadCheckbox.checked = result.showRead || false;
        loadArticles();
    });

    // Update alert statistics
    function updateAlertStats() {
        chrome.runtime.sendMessage({ action: 'getAlertStats' }, (response) => {
            if (response.alertStats) {
                const stats = response.alertStats;
                
                totalAlertsElement.textContent = stats.totalAlerts;
                soundAlertsElement.textContent = stats.sounds;
                notificationAlertsElement.textContent = stats.notifications;

                // Update alert times list
                alertTimesElement.innerHTML = '';
                const recentAlerts = [...stats.alertTimes].reverse().slice(0, 10); // Show last 10 alerts
                
                recentAlerts.forEach(timeStr => {
                    const time = new Date(timeStr);
                    const timeAgo = getTimeAgo(time);
                    
                    const alertItem = document.createElement('div');
                    alertItem.className = 'alert-time-item';
                    alertItem.textContent = `Alert ${timeAgo}`;
                    alertTimesElement.appendChild(alertItem);
                });
            }
        });
    }

    // Helper function to format time ago
    function getTimeAgo(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // difference in seconds

        if (diff < 60) {
            return `${diff} seconds ago`;
        } else if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diff / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    // Update last fetch time
    function updateLastFetchTime() {
        chrome.runtime.sendMessage({ action: 'getLastFetchTime' }, (response) => {
            if (response.lastFetchTime) {
                const lastFetch = new Date(response.lastFetchTime);
                lastFetchElement.textContent = `Last updated ${getTimeAgo(lastFetch)}`;
            }
        });
    }

    // Load and display articles
    async function loadArticles() {
        articlesContainer.innerHTML = '<div class="loading">Loading articles...</div>';
        
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'getArticles' }, resolve);
            });

            if (!response || !response.articles) {
                throw new Error('Failed to fetch articles');
            }

            const { articles } = response;
            
            if (articles.length === 0) {
                articlesContainer.innerHTML = '<div class="no-articles">No articles found</div>';
                return;
            }

            // Filter articles based on read status if necessary
            const filteredArticles = showReadCheckbox.checked 
                ? articles 
                : articles.filter(article => !article.isRead);

            // Create article elements
            const articleElements = filteredArticles.map(article => {
                const articleElement = document.createElement('div');
                articleElement.className = `article${article.isRead ? ' read' : ''}`;
                
                const date = new Date(article.created_at);
                const timeAgo = getTimeAgo(date);

                articleElement.innerHTML = `
                    <div class="article-title">${article.title}</div>
                    <div class="article-meta">
                        ${timeAgo}
                    </div>
                `;

                // Handle article click
                articleElement.addEventListener('click', async () => {
                    // Mark as read in storage
                    await new Promise((resolve) => {
                        chrome.runtime.sendMessage({ 
                            action: 'markAsRead', 
                            articleId: article.id 
                        }, resolve);
                    });

                    // Open article in new tab
                    if (article.url) {
                        chrome.tabs.create({ url: article.url });
                    }

                    // Refresh the article list
                    loadArticles();
                });

                return articleElement;
            });

            // Clear and append new articles
            articlesContainer.innerHTML = '';
            articleElements.forEach(element => articlesContainer.appendChild(element));

            // Update times and stats
            updateLastFetchTime();
            updateAlertStats();

        } catch (error) {
            console.error('Error loading articles:', error);
            articlesContainer.innerHTML = `
                <div class="no-articles">
                    Error loading articles. Please try again.
                </div>
            `;
        }
    }

    // Event Listeners
    showReadCheckbox.addEventListener('change', (event) => {
        chrome.storage.local.set({ showRead: event.target.checked });
        loadArticles();
    });

    refreshButton.addEventListener('click', loadArticles);

    // 获取统计数据元素
    const totalAlertsEl = document.getElementById('totalAlerts');
    const soundAlertsEl = document.getElementById('soundAlerts');
    const notificationAlertsEl = document.getElementById('notificationAlerts');
    const alertLogsEl = document.getElementById('alertLogs');
    const logTypeSelect = document.getElementById('logType');
    const clearLogsBtn = document.getElementById('clearLogs');

    // 格式化时间
    function formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // 更新统计数据显示
    function updateStats(stats) {
        if (!stats) return;
        
        totalAlertsEl.textContent = stats.totalAlerts;
        soundAlertsEl.textContent = stats.sounds;
        notificationAlertsEl.textContent = stats.notifications;
        
        updateLogs(stats.alertLogs);
    }

    // 更新日志显示
    function updateLogs(logs, filterType = 'all') {
        if (!logs) return;
        
        alertLogsEl.innerHTML = '';
        
        const filteredLogs = filterType === 'all' 
            ? logs 
            : logs.filter(log => log.type === filterType);
        
        filteredLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = formatTime(log.timestamp);
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `log-type ${log.type}`;
            typeSpan.textContent = {
                'sound': '声音',
                'notification': '通知',
                'high': '高优',
                'normal': '普通'
            }[log.type] || log.type;
            
            const messageSpan = document.createElement('span');
            messageSpan.className = 'log-message';
            messageSpan.textContent = log.message;
            
            logItem.appendChild(timeSpan);
            logItem.appendChild(typeSpan);
            logItem.appendChild(messageSpan);
            alertLogsEl.appendChild(logItem);
        });
    }

    // 获取初始统计数据
    const data = await chrome.storage.local.get(['alertStats']);
    if (data.alertStats) {
        updateStats(data.alertStats);
    }

    // 监听日志类型选择变化
    logTypeSelect.addEventListener('change', async () => {
        const data = await chrome.storage.local.get(['alertStats']);
        if (data.alertStats) {
            updateLogs(data.alertStats.alertLogs, logTypeSelect.value);
        }
    });

    // 监听清除日志按钮点击
    clearLogsBtn.addEventListener('click', async () => {
        const data = await chrome.storage.local.get(['alertStats']);
        if (data.alertStats) {
            data.alertStats.alertLogs = [];
            await chrome.storage.local.set({ alertStats: data.alertStats });
            updateLogs([]);
        }
    });

    // 监听来自background的统计更新消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'statsUpdate') {
            updateStats(message.data);
        }
    });

    // Initial load
    loadArticles();
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