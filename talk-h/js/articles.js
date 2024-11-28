// 文章列表管理
class ArticleManager {
    constructor() {
        this.articles = [];
        this.statusElement = document.getElementById('status');
        this.listElement = document.getElementById('articleList');
        
        // 绑定按钮事件
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadArticles());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearArticles());
        
        // 初始加载
        this.loadArticles();
        
        // 设置自动刷新
        this.startAutoRefresh();
    }

    // 开始自动刷新
    startAutoRefresh() {
        setInterval(() => this.loadArticles(), 30000); // 每30秒刷新一次
    }

    // 更新状态显示
    updateStatus(message, type = 'info') {
        this.statusElement.textContent = message;
        this.statusElement.style.color = type === 'error' ? '#dc3545' : '#666';
        setTimeout(() => {
            this.statusElement.textContent = '';
        }, 3000);
    }

    // 加载文章列表
    async loadArticles() {
        try {
            const { articles = [], readArticles = [] } = await chrome.storage.local.get(['articles', 'readArticles']);
            this.articles = articles;
            this.readArticles = new Set(readArticles);
            this.renderArticles();
            this.updateStatus(`已加载 ${articles.length} 篇文章`);
        } catch (error) {
            console.error('Failed to load articles:', error);
            this.updateStatus('加载文章失败', 'error');
        }
    }

    // 清空文章列表
    async clearArticles() {
        if (!confirm('确定要清空所有文章吗？')) {
            return;
        }
        
        try {
            await chrome.storage.local.set({ articles: [], readArticles: [] });
            this.articles = [];
            this.readArticles = new Set();
            this.renderArticles();
            this.updateStatus('文章列表已清空');
        } catch (error) {
            console.error('Failed to clear articles:', error);
            this.updateStatus('清空文章失败', 'error');
        }
    }

    // 标记文章为已读
    async markAsRead(articleId) {
        try {
            this.readArticles.add(articleId);
            await chrome.storage.local.set({ readArticles: Array.from(this.readArticles) });
            this.renderArticles();
        } catch (error) {
            console.error('Failed to mark article as read:', error);
            this.updateStatus('标记已读失败', 'error');
        }
    }

    // 渲染文章列表
    renderArticles() {
        if (this.articles.length === 0) {
            this.listElement.innerHTML = '<div class="empty-state">暂无文章</div>';
            return;
        }

        // 按时间倒序排序，未读和高优先级排在前面
        const sortedArticles = [...this.articles].sort((a, b) => {
            // 优先级排序
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            
            // 已读状态排序
            const aRead = this.readArticles.has(a.id);
            const bRead = this.readArticles.has(b.id);
            if (!aRead && bRead) return -1;
            if (aRead && !bRead) return 1;
            
            // 时间排序
            return new Date(b.receivedAt) - new Date(a.receivedAt);
        });

        this.listElement.innerHTML = sortedArticles.map(article => {
            const isRead = this.readArticles.has(article.id);
            return `
                <div class="article ${article.priority === 'high' ? 'high-priority' : ''} ${isRead ? 'read' : ''}"
                     data-id="${article.id}">
                    <div class="article-title">
                        ${article.title}
                        ${isRead ? '<span class="read-badge">已读</span>' : ''}
                    </div>
                    <div class="article-meta">
                        来源: ${article.source} | 
                        优先级: ${article.priority === 'high' ? '高' : '普通'} | 
                        接收时间: ${new Date(article.receivedAt).toLocaleString()}
                    </div>
                    <div class="article-summary">${article.summary || '无摘要'}</div>
                    <div class="article-actions">
                        <button class="action-btn" onclick="window.open('${article.url}', '_blank')">
                            查看原文
                        </button>
                        ${!isRead ? `
                            <button class="action-btn mark-read" onclick="articleManager.markAsRead('${article.id}')">
                                标记已读
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 全局实例
let articleManager;

// 等待页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    articleManager = new ArticleManager();
});
