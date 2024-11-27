/**
 * 文章提醒管理器
 */
import { createClient } from '@supabase/supabase-js'

// 添加配置导入
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

class ArticleNotifier {
    constructor() {
        this.unreadCount = 0;
        this.lastCheckTime = Date.now();
        this.dbStatus = 'disconnected';
        this.initBadge();
        this.initSupabase();
        this.setupMessageListeners();
    }

    // 设置消息监听
    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'checkDatabaseStatus') {
                sendResponse({ status: this.dbStatus });
                this.checkDatabaseStatus();
                return true;
            }
        });
    }

    // 检查数据库状态
    async checkDatabaseStatus() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase client not initialized');
            }

            console.log('检查数据库连接...');
            const { data, error } = await this.supabase
                .from('articles')
                .select('count')
                .limit(1);

            if (error) {
                console.error('数据库查询错误:', error);
                throw error;
            }

            console.log('数据库连接正常:', data);
            this.updateDatabaseStatus('connected');
            return true;
        } catch (error) {
            console.error('数据库状态检查失败:', error.message);
            this.updateDatabaseStatus('disconnected');
            return false;
        }
    }

    // 添加重试机制
    async retryConnection(maxRetries = 3, delay = 5000) {
        let retries = 0;
        while (retries < maxRetries) {
            console.log(`尝试重新连接 (${retries + 1}/${maxRetries})...`);
            if (await this.initSupabase()) {
                return true;
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        return false;
    }

    // 更新数据库状态
    updateDatabaseStatus(status) {
        if (this.dbStatus !== status) {
            this.dbStatus = status;
            chrome.runtime.sendMessage({
                type: 'databaseStatusChange',
                status: status
            });
        }
    }

    // 初始化徽章
    initBadge() {
        chrome.action.setBadgeBackgroundColor({ color: '#1565c0' });
        this.updateBadge(0);
    }

    // 初始化 Supabase
    async initSupabase() {
        try {
            this.updateDatabaseStatus('connecting');
            console.log('正在连接 Supabase...');
            
            // 使用与 Talk-G 相同的连接方式
            this.supabase = createClient(
                'https://tkcrnfgnspvtzwbbvyfv.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEwMDg4NzcsImV4cCI6MjAxNjU4NDg3N30.BbzNnz5iF7oFAXbKJYzLxwBLvLXyXgGHVP1UkTZqnKo'
            );

            // 测试连接
            const { data, error } = await this.supabase
                .from('articles')
                .select('count');

            if (error) throw error;

            console.log('数据库连接成功，文章总数:', data);
            this.updateDatabaseStatus('connected');
            
            // 设置实时订阅
            await this.setupRealtimeSubscription();
        } catch (error) {
            console.error('数据库连接失败:', error.message);
            this.updateDatabaseStatus('disconnected');
            setTimeout(() => this.initSupabase(), 5000);
        }
    }

    // 设置实时订阅
    async setupRealtimeSubscription() {
        const channel = this.supabase
            .channel('articles')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'articles'
                },
                (payload) => {
                    this.handleNewArticle(payload.new);
                }
            )
            .subscribe();
    }

    // 处理新文章
    async handleNewArticle(article) {
        // 更新徽章
        this.updateBadge(this.unreadCount + 1);

        // 存储文章
        await this.storeArticle(article);

        // 显示桌面通知
        this.showNotification(article);

        // 播放提示音
        this.playNotificationSound();

        // 语音提醒
        this.speakNotification(article);

        // 弹出预览窗口
        this.showPreviewWindow(article);

        // 新增提醒方式
        this.flashScreen();              // 屏幕闪烁
        this.showFloatingWindow(article);// 悬浮窗
        this.showFullScreenAlert(article);// 全屏提醒
        this.showTabNotification(article);// 新标签页提醒
        this.vibrateDevice();           // 设备振动（如果支持）
        this.showProgressiveNotification(article); // 渐进式提醒
    }

    // 显示通知
    showNotification(article) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon128.png',
            title: '新文章提醒',
            message: `${article.title}\n${article.summary || ''}`,
            buttons: [
                { title: '立即阅读' },
                { title: '稍后提醒' }
            ],
            requireInteraction: true  // 通知不会自动消失
        });
    }

    // 语音提醒
    speakNotification(article) {
        const text = `您有新文章：${article.title}`;
        chrome.tts.speak(text, {
            lang: 'zh-CN',
            rate: 1.0,
            pitch: 1.0
        });
    }

    // 显示预览窗口
    showPreviewWindow(article) {
        chrome.windows.create({
            url: 'preview.html',
            type: 'popup',
            width: 400,
            height: 600
        });
    }

    // 播放提示音
    playNotificationSound() {
        const audio = new Audio('audio/notification.mp3');
        audio.play();
    }

    // 更新徽章
    updateBadge(count) {
        this.unreadCount = count;
        chrome.action.setBadgeText({
            text: count > 0 ? count.toString() : ''
        });
    }

    // 存储文章
    async storeArticle(article) {
        const { articles = [] } = await chrome.storage.local.get('articles');
        articles.push({
            ...article,
            isRead: false,
            receivedAt: Date.now()
        });
        await chrome.storage.local.set({ articles });
    }

    // 屏幕闪烁提醒
    async flashScreen() {
        const settings = await this.getSettings();
        if (!settings.enableScreenFlash) return;

        let count = 0;
        const flash = setInterval(() => {
            if (count >= 6) {
                clearInterval(flash);
                return;
            }
            // 通过改变背景色实现闪烁效果
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'flash',
                        state: count % 2 === 0
                    });
                }
            });
            count++;
        }, 500);
    }

    // 悬浮窗提醒
    showFloatingWindow(article) {
        chrome.windows.create({
            url: 'floating.html',
            type: 'popup',
            width: 300,
            height: 150,
            left: screen.width - 320,
            top: screen.height - 170,
            focused: false
        });
    }

    // 全屏提醒
    showFullScreenAlert(article) {
        chrome.windows.create({
            url: `fullscreen.html?title=${encodeURIComponent(article.title)}`,
            type: 'popup',
            state: 'fullscreen'
        });
    }

    // 新标签页提醒
    showTabNotification(article) {
        chrome.tabs.create({
            url: `notification.html?id=${article.id}`,
            active: false
        });
    }

    // 设备振动
    vibrateDevice() {
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]); // 振动模式：200ms开-100ms关-200ms开
        }
    }

    // 渐进式提醒（多级提醒）
    showProgressiveNotification(article) {
        const levels = [
            { delay: 0, type: 'gentle' },
            { delay: 60000, type: 'moderate' },
            { delay: 300000, type: 'urgent' }
        ];

        levels.forEach(level => {
            setTimeout(() => {
                if (!this.isArticleRead(article.id)) {
                    this.showLevelNotification(article, level.type);
                }
            }, level.delay);
        });
    }

    // 不同级别的提醒
    showLevelNotification(article, level) {
        const config = {
            gentle: {
                sound: 'gentle.mp3',
                priority: 0
            },
            moderate: {
                sound: 'moderate.mp3',
                priority: 1
            },
            urgent: {
                sound: 'urgent.mp3',
                priority: 2
            }
        };

        const settings = config[level];
        
        // 播放对应级别的声音
        const audio = new Audio(`audio/${settings.sound}`);
        audio.play();

        // 显示对应级别的通知
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon128.png',
            title: `${level.toUpperCase()} - 新文章提醒`,
            message: article.title,
            priority: settings.priority,
            requireInteraction: true
        });
    }
}

// 初始化通知器
const notifier = new ArticleNotifier(); 