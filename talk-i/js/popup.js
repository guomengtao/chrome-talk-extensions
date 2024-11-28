import { supabase, testConnection } from './supabase.js';

class ArticleList {
    constructor() {
        this.currentFilter = 'all';
        this.articles = [];
        this.initUI();
        this.bindEvents();
    }

    async initUI() {
        try {
            // 等待 Supabase 连接初始化
            this.updateConnectionStatus(false, '正在连接数据库...');
            console.log('Testing Supabase connection...');
            const isConnected = await testConnection();
            if (isConnected) {
                this.updateConnectionStatus(true, '数据库已连接');
                console.log('Connection test passed, loading articles...');
                await this.loadArticles();
            } else {
                this.updateConnectionStatus(false, '数据库连接失败');
                this.showStatus('数据库连接失败，请稍后重试', 'error');
            }
        } catch (error) {
            console.error('初始化失败:', error);
            this.updateConnectionStatus(false, '连接失败');
            this.showStatus('初始化失败: ' + error.message, 'error');
        }
    }

    bindEvents() {
        // 过滤按钮事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterButtons();
                this.loadArticles();
            });
        });

        // 文章点击事件
        document.querySelector('.article-list').addEventListener('click', (e) => {
            const articleItem = e.target.closest('.article-item');
            if (articleItem) {
                const articleId = articleItem.dataset.id;
                this.openArticle(articleId);
            }
        });

        // 返回按钮事件
        document.querySelector('.back-btn').addEventListener('click', () => {
            this.showListView();
        });
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    async loadArticles() {
        try {
            console.log('开始加载文章列表...');
            console.log('当前过滤条件:', this.currentFilter);

            let query = supabase
                .from('articles')
                .select('id, title, content, created_at, url')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (this.currentFilter === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (this.currentFilter === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('created_at', weekAgo.toISOString());
            }

            const { data: articles, error } = await query;
            
            if (error) throw error;

            this.articles = articles || [];
            this.renderArticles();
            await this.updateStats();

            if (this.articles.length > 0) {
                console.log('文章列表渲染完成');
            } else {
                console.log('没有找到文章');
                this.showError('暂无文章');
            }
        } catch (error) {
            console.error('加载文章列表失败:', error);
            this.showStatus('加载文章列表失败: ' + error.message, 'error');
        }
    }

    renderArticles() {
        const container = document.querySelector('.article-list');
        container.innerHTML = this.articles.map(article => `
            <div class="article-item" data-id="${article.id}">
                <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
                <div class="article-meta">
                    <span class="article-time">${new Date(article.created_at).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    async openArticle(articleId) {
        try {
            const { data: article, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', articleId)
                .single();

            if (error) throw error;

            if (article) {
                this.showDetailView(article);
            } else {
                this.showError('文章不存在');
            }
        } catch (error) {
            console.error('加载文章详情失败:', error);
            this.showStatus('加载文章详情失败: ' + error.message, 'error');
        }
    }

    showDetailView(article) {
        // 填充详情内容
        document.querySelector('.detail-title').textContent = article.title;
        document.querySelector('.detail-content').innerHTML = article.content;
        document.querySelector('.detail-time').textContent = new Date(article.created_at).toLocaleString();
        
        const urlLink = document.querySelector('.detail-url');
        if (article.url) {
            urlLink.href = article.url;
            urlLink.style.display = 'inline';
        } else {
            urlLink.style.display = 'none';
        }

        // 切换视图
        document.querySelector('.list-view').classList.add('hide');
        document.querySelector('.detail-view').classList.remove('hidden');
        setTimeout(() => {
            document.querySelector('.detail-view').classList.add('show');
        }, 50);
    }

    showListView() {
        // 切换回列表视图
        document.querySelector('.detail-view').classList.remove('show');
        setTimeout(() => {
            document.querySelector('.detail-view').classList.add('hidden');
            document.querySelector('.list-view').classList.remove('hide');
        }, 300);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        const container = document.querySelector('.article-list');
        container.innerHTML = `
            <div class="error-message">
                ${this.escapeHtml(message)}
                <button class="retry-btn" onclick="window.articleList.loadArticles()">重试</button>
            </div>
        `;
    }

    async updateStats() {
        try {
            // 获取总数
            const { data: totalData } = await supabase
                .from('articles')
                .select('count')
                .eq('is_deleted', false);

            // 获取今日数量
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: todayData } = await supabase
                .from('articles')
                .select('count')
                .eq('is_deleted', false)
                .gte('created_at', today.toISOString());

            // 获取本周数量
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: weekData } = await supabase
                .from('articles')
                .select('count')
                .eq('is_deleted', false)
                .gte('created_at', weekAgo.toISOString());

            // 更新UI
            document.querySelector('.total-count').textContent = totalData[0].count;
            document.querySelector('.today-count').textContent = todayData[0].count;
            document.querySelector('.week-count').textContent = weekData[0].count;

        } catch (error) {
            console.error('更新统计信息失败:', error);
            this.showStatus('更新统计信息失败', 'error');
        }
    }

    updateConnectionStatus(connected, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        statusDot.classList.toggle('connected', connected);
        statusText.textContent = message;
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status show ${type}`;
        
        setTimeout(() => {
            status.classList.remove('show');
        }, 3000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.articleList = new ArticleList();
});