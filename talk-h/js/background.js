// Service Worker 激活时
self.addEventListener('activate', event => {
    console.log('Service Worker activated');
});

// Service Worker 安装时
self.addEventListener('install', event => {
    console.log('Service Worker installed');
    self.skipWaiting(); // 确保新的 Service Worker 立即激活
});

// Supabase 配置
const SUPABASE_URL = 'https://tkcrnfgnspvtzwbbvyfv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODgwMTgsImV4cCI6MjA0NjU2NDAxOH0.o4kZY3X0XxcpM3OHO3yw7O3of2PPtXdQ4CBFgp3CMO8';

// 创建通知器类
class ArticleNotifier {
    constructor() {
        this.lastFetchTime = null;
        this.readArticles = new Set();
        this.alertStats = {
            notifications: 0,
            sounds: 0,
            totalAlerts: 0,
            alertTimes: [],
            alertLogs: []
        };
        this.initialize();
    }

    async initialize() {
        console.log('ArticleNotifier initialized');
        
        // 从存储中恢复状态
        const stored = await chrome.storage.local.get(['alertStats', 'lastFetchTime', 'readArticles']);
        if (stored.alertStats) {
            this.alertStats = stored.alertStats;
        }
        if (stored.lastFetchTime) {
            this.lastFetchTime = new Date(stored.lastFetchTime);
        }
        if (stored.readArticles) {
            this.readArticles = new Set(stored.readArticles);
        }
        
        await this.initializeBadge();
        this.startPeriodicFetch();
    }

    async saveAlertStats() {
        await chrome.storage.local.set({ alertStats: this.alertStats });
    }

    async initializeBadge() {
        try {
            await chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
            this.updateBadge(0);
            console.log('Badge initialized');
        } catch (error) {
            console.error('Error initializing badge:', error);
        }
    }

    async updateBadge(count) {
        try {
            await chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
            console.log('Badge updated:', count);
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    startPeriodicFetch() {
        this.fetchAndProcessArticles();
        setInterval(() => this.fetchAndProcessArticles(), 5 * 60 * 1000);
    }

    async getSupabaseArticles() {
        try {
            console.log('Fetching articles from Supabase...');
            
            const queryParams = new URLSearchParams({
                select: '*',
                is_deleted: 'eq.false',
                order: 'created_at.desc'
            });

            const url = `${SUPABASE_URL}/rest/v1/articles?${queryParams}`;
            const headers = {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            };

            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const articles = await response.json();
            return { articles, total: articles.length };
        } catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
        }
    }

    async fetchAndProcessArticles() {
        try {
            const { articles } = await this.getSupabaseArticles();
            const currentTime = new Date();
            
            // Filter new articles
            const newArticles = articles.filter(article => {
                const articleDate = new Date(article.created_at);
                return !this.lastFetchTime || articleDate > this.lastFetchTime;
            });

            // Update badge with unread count
            const unreadCount = articles.filter(article => !this.readArticles.has(article.id)).length;
            this.updateBadge(unreadCount);

            // Process new articles
            await this.processNewArticles(newArticles);

            // Update last fetch time
            this.lastFetchTime = currentTime;
            await chrome.storage.local.set({ 
                lastFetchTime: currentTime.toISOString() 
            });

        } catch (error) {
            console.error('Error processing articles:', error);
        }
    }

    async markArticleAsRead(articleId) {
        this.readArticles.add(articleId);
        await chrome.storage.local.set({ readArticles: Array.from(this.readArticles) });
        
        const { articles } = await this.getSupabaseArticles();
        const unreadCount = articles.filter(article => !this.readArticles.has(article.id)).length;
        this.updateBadge(unreadCount);
    }

    async logAlert(type, message) {
        const log = {
            type,
            message,
            timestamp: new Date().toISOString()
        };
        
        // 添加新日志到开头
        this.alertStats.alertLogs.unshift(log);
        
        // 保持最多100条日志
        if (this.alertStats.alertLogs.length > 100) {
            this.alertStats.alertLogs.pop();
        }
        
        // 保存到本地存储
        await this.saveAlertStats();
        
        // 发送消息到popup
        this.broadcastStatsUpdate();
    }

    async playNotificationSound() {
        const audio = new Audio(chrome.runtime.getURL('assets/complete.mp3'));
        await audio.play();
        this.alertStats.sounds++;
        this.alertStats.totalAlerts++;
        await this.logAlert('sound', '播放了提醒音效');
    }

    async showNotification(article) {
        const options = {
            type: 'basic',
            iconUrl: 'assets/icon128.png',
            title: '新文章提醒',
            message: article.title
        };

        await chrome.notifications.create(`article-${article.id}`, options);
        this.alertStats.notifications++;
        this.alertStats.totalAlerts++;
        await this.logAlert('notification', `显示通知: ${article.title}`);
    }

    async processArticleImages(article) {
        try {
            if (!article.image_url) {
                return article;
            }

            // 尝试下载图片，如果失败则继续处理文章但不包含图片
            try {
                await fetch(article.image_url);
            } catch (error) {
                console.warn('无法下载图片:', error);
                article.image_url = null;
            }
            
            return article;
        } catch (error) {
            console.error('处理文章图片时出错:', error);
            return article;
        }
    }

    async processNewArticles(newArticles) {
        if (!Array.isArray(newArticles) || newArticles.length === 0) {
            return;
        }

        try {
            // 获取用户设置
            const { alertControls } = await chrome.storage.local.get('alertControls');
            const settings = alertControls || { notification: true, sound: true };

            for (const article of newArticles) {
                // 播放提示音
                if (settings.sound) {
                    try {
                        const audio = new Audio(chrome.runtime.getURL('sounds/notification.mp3'));
                        await audio.play();
                        
                        this.alertStats.sounds++;
                        await this.logAlert('sound', '播放了新文章提示音');
                    } catch (error) {
                        console.error('Error playing sound:', error);
                    }
                }

                // 显示通知
                if (settings.notification) {
                    try {
                        const options = {
                            type: 'basic',
                            iconUrl: chrome.runtime.getURL('images/icon128.png'),
                            title: '新文章提醒',
                            message: article.title,
                            priority: article.priority === 'high' ? 2 : 0,
                            buttons: [
                                { title: '立即查看' },
                                { title: '稍后提醒' }
                            ]
                        };

                        await chrome.notifications.create(`article-${article.id}`, options);
                        this.alertStats.notifications++;
                        await this.logAlert('notification', `显示通知: ${article.title}`);
                    } catch (error) {
                        console.error('Error showing notification:', error);
                    }
                }

                // 更新统计信息
                this.alertStats.totalAlerts++;
                this.alertStats.alertTimes.push(new Date().toISOString());
                
                // 保持最多100条时间记录
                if (this.alertStats.alertTimes.length > 100) {
                    this.alertStats.alertTimes.shift();
                }
            }

            // 保存统计信息
            await this.saveAlertStats();
            
            // 更新角标
            await this.updateBadge(newArticles.length);
            
            // 广播更新
            this.broadcastStatsUpdate();
        } catch (error) {
            console.error('Error processing new articles:', error);
        }
    }

    async updateBadgeText(count) {
        try {
            await chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
            console.log('Badge updated:', count);
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    async broadcastStatsUpdate() {
        try {
            // 向所有打开的popup发送更新消息
            chrome.runtime.sendMessage({
                action: 'statsUpdated',
                stats: this.alertStats
            });
        } catch (error) {
            // 忽略popup未打开的错误
            if (!error.message.includes('receiving end does not exist')) {
                console.error('Error broadcasting stats:', error);
            }
        }
    }

    listenForMessages() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'getArticles') {
                this.getSupabaseArticles()
                    .then(({ articles }) => {
                        sendResponse({ articles });
                    })
                    .catch(error => {
                        sendResponse({ error: error.message });
                    });
                return true; // 保持消息通道开启
            }
            
            if (message.action === 'markAsRead') {
                this.markArticleAsRead(message.articleId)
                    .then(() => {
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        sendResponse({ error: error.message });
                    });
                return true;
            }
            
            if (message.action === 'clearBadge') {
                this.updateBadge(0)
                    .then(() => {
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        sendResponse({ error: error.message });
                    });
                return true;
            }
        });
    }
}

// Initialize the article notifier
const articleNotifier = new ArticleNotifier();
articleNotifier.listenForMessages();
