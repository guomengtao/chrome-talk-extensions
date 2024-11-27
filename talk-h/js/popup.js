class PopupManager {
    constructor() {
        this.initializeSettings();
        this.loadArticles();
        this.bindEvents();
        this.initDatabaseStatus();
        this.updateArticleStats();
    }

    // 初始化设置
    async initializeSettings() {
        const settings = await chrome.storage.local.get('settings');
        const defaultSettings = {
            enableSound: true,
            enableVoice: true,
            enablePreview: true,
            enableScreenFlash: false,
            enableFloating: true,
            enableFullScreen: false,
            enableTabNotification: true,
            enableVibration: true,
            enableProgressive: true
        };

        // 使用存储的设置或默认设置
        const currentSettings = settings.settings || defaultSettings;

        // 设置复选框状态
        Object.keys(currentSettings).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.checked = currentSettings[key];
            }
        });
    }

    // 初始化数据库状态监听
    async initDatabaseStatus() {
        this.updateDatabaseStatus('connecting');
        
        // 获取当前状态
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { type: 'checkDatabaseStatus' },
                    (response) => resolve(response)
                );
            });
            
            if (response && response.status) {
                this.updateDatabaseStatus(response.status);
            }
        } catch (error) {
            console.error('获取数据库状态失败:', error);
            this.updateDatabaseStatus('disconnected');
        }

        // 监听状态变化
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'databaseStatusChange') {
                this.updateDatabaseStatus(message.status);
            }
        });
    }

    // 更新数据库状态显示
    updateDatabaseStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (!statusDot || !statusText) return;

        statusDot.className = 'status-dot ' + status;
        
        const statusMessages = {
            connected: '数据库已连接',
            connecting: '正在连接数据库...',
            disconnected: '数据库连接失败 (点击重试)'
        };
        
        statusText.textContent = statusMessages[status] || '未知状态';
        console.log('数据库状态更新:', status);

        // 添加重试点击事件
        if (status === 'disconnected') {
            statusText.style.cursor = 'pointer';
            statusText.onclick = () => {
                chrome.runtime.sendMessage({ type: 'retryConnection' });
                this.updateDatabaseStatus('connecting');
            };
        } else {
            statusText.style.cursor = 'default';
            statusText.onclick = null;
        }
    }

    // 更新文章统计
    async updateArticleStats() {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const totalCount = articles.length;
        const readCount = articles.filter(article => article.isRead).length;
        const unreadCount = totalCount - readCount;

        document.querySelector('.total-count').textContent = `总文章: ${totalCount}`;
        document.querySelector('.read-count').textContent = `已读: ${readCount}`;
        document.querySelector('.unread-count').textContent = `未读: ${unreadCount}`;
    }

    // 加载文章列表
    async loadArticles() {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const unreadArticles = articles.filter(article => !article.isRead);
        this.renderArticles(unreadArticles);
        this.updateArticleStats();
    }

    // 渲染文章列表
    renderArticles(articles) {
        const articleList = document.querySelector('.article-list');
        if (articles.length === 0) {
            articleList.innerHTML = '<div class="empty-message">暂无未读文章</div>';
            return;
        }

        articleList.innerHTML = articles.map(article => `
            <div class="article-item" data-id="${article.id}">
                <div class="article-title">${article.title}</div>
                <div class="article-time">${new Date(article.receivedAt).toLocaleString()}</div>
            </div>
        `).join('');
    }

    // 绑定事件
    bindEvents() {
        // 设置变更事件
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const settings = await chrome.storage.local.get('settings');
                const currentSettings = settings.settings || {};
                currentSettings[e.target.id] = e.target.checked;
                await chrome.storage.local.set({ settings: currentSettings });
            });
        });

        // 文章点击事件
        document.querySelector('.article-list').addEventListener('click', async (e) => {
            const articleItem = e.target.closest('.article-item');
            if (articleItem) {
                const articleId = articleItem.dataset.id;
                await this.markArticleAsRead(articleId);
                this.loadArticles(); // 重新加载列表
            }
        });
    }

    // 标记文章为已读
    async markArticleAsRead(articleId) {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const updatedArticles = articles.map(article => {
            if (article.id === articleId) {
                return { ...article, isRead: true };
            }
            return article;
        });
        await chrome.storage.local.set({ articles: updatedArticles });
        this.updateArticleStats();
    }
}

// 初始化弹出窗口
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
}); 