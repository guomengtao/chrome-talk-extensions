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
            const { articles = [] } = await chrome.storage.local.get('articles');
            this.articles = articles;
            this.renderArticles();
            this.updateStatus(`已加载 ${articles.length} 篇文章`);
        } catch (error) {
            console.error('Failed to load articles:', error);
            this.updateStatus('加载文章失败', 'error');
        }
    }

    // 清空文章列表
    async clearArticles() {
        try {
            await chrome.storage.local.set({ articles: [] });
            this.articles = [];
            this.renderArticles();
            this.updateStatus('文章列表已清空');
        } catch (error) {
            console.error('Failed to clear articles:', error);
            this.updateStatus('清空文章失败', 'error');
        }
    }

    // 渲染文章列表
    renderArticles() {
        if (this.articles.length === 0) {
            this.listElement.innerHTML = '<div class="empty-state">暂无文章</div>';
            return;
        }

        // 按时间倒序排序
        const sortedArticles = [...this.articles].sort((a, b) => b.receivedAt - a.receivedAt);

        this.listElement.innerHTML = sortedArticles.map(article => `
            <div class="article ${article.priority === 'high' ? 'high-priority' : ''}">
                <div class="article-title">${article.title}</div>
                <div class="article-meta">
                    来源: ${article.source} | 
                    优先级: ${article.priority === 'high' ? '高' : '普通'} | 
                    接收时间: ${new Date(article.receivedAt).toLocaleString()}
                </div>
                <div class="article-summary">${article.summary}</div>
            </div>
        `).join('');
    }
}

// 等待页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    new ArticleManager();
});
