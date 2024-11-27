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
            alertLogs: []  // 新增日志数组
        };
        this.initialize();
    }

    async initialize() {
        console.log('ArticleNotifier initialized');
        
        // Load data from storage
        const data = await chrome.storage.local.get([
            'readArticles', 
            'lastFetchTime',
            'alertStats'
        ]);

        if (data.readArticles) {
            this.readArticles = new Set(data.readArticles);
        }
        if (data.lastFetchTime) {
            this.lastFetchTime = new Date(data.lastFetchTime);
        }
        if (data.alertStats) {
            this.alertStats = data.alertStats;
        }

        this.initializeBadge();
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

    async processNewArticles(articles) {
        console.log('Processing new articles...');
        let newArticlesFound = false;
        
        for (const article of articles) {
            if (!this.readArticles.has(article.id)) {
                console.log('New article found:', article.title);
                newArticlesFound = true;
                
                this.readArticles.add(article.id);
                
                // 根据优先级决定提醒方式
                if (article.priority === 'high') {
                    await this.showNotification(article);
                    await this.playNotificationSound();
                    await this.logAlert('high', `高优先级文章: ${article.title}`);
                } else {
                    await this.showNotification(article);
                    await this.logAlert('normal', `普通文章: ${article.title}`);
                }
            }
        }
    }

    broadcastStatsUpdate() {
        chrome.runtime.sendMessage({
            type: 'statsUpdate',
            data: this.alertStats
        }).catch(error => {
            console.log('Error broadcasting stats update:', error);
        });
    }

    listenForMessages() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Background script received message:', message);

            try {
                switch (message.action) {
                    case 'getArticles':
                        this.getSupabaseArticles()
                            .then(response => {
                                response.articles = response.articles.map(article => ({
                                    ...article,
                                    isRead: this.readArticles.has(article.id)
                                }));
                                sendResponse(response);
                            })
                            .catch(error => {
                                console.error('Error getting articles:', error);
                                sendResponse({ articles: [], total: 0, error: error.message });
                            });
                        return true;

                    case 'markAsRead':
                        this.markArticleAsRead(message.articleId)
                            .then(() => sendResponse({ success: true }))
                            .catch(error => sendResponse({ success: false, error: error.message }));
                        return true;

                    case 'getLastFetchTime':
                        sendResponse({ lastFetchTime: this.lastFetchTime });
                        return true;

                    case 'getAlertStats':
                        sendResponse({ alertStats: this.alertStats });
                        return true;

                    default:
                        console.warn('Unknown message action:', message.action);
                        sendResponse({ status: 'error', error: 'Unknown action' });
                        return false;
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ status: 'error', error: error.message });
                return false;
            }
        });
    }
}

// Initialize the article notifier
const articleNotifier = new ArticleNotifier();
articleNotifier.listenForMessages();
