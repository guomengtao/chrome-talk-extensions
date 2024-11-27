import { supabase } from './supabase.js';

class ArticleList {
    constructor() {
        this.currentFilter = 'all';
        this.initUI();
        this.bindEvents();
    }

    async initUI() {
        await this.loadArticles();
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
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    async loadArticles() {
        try {
            const filter = {};
            if (this.currentFilter === 'today') filter.today = true;
            if (this.currentFilter === 'week') filter.week = true;

            const articles = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { type: 'getArticles', filter },
                    (response) => resolve(response)
                );
            });

            this.renderArticles(articles);
        } catch (error) {
            console.error('加载文章失败:', error);
            this.showError('加载文章失败');
        }
    }

    renderArticles(articles) {
        const container = document.querySelector('.article-list');
        
        if (!articles || articles.length === 0) {
            container.innerHTML = '<div class="empty-message">暂无文章</div>';
            return;
        }

        container.innerHTML = articles.map(article => `
            <div class="article-item" data-id="${article.id}">
                <div class="article-title">${article.title}</div>
                <div class="article-time">
                    ${new Date(article.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    openArticle(articleId) {
        chrome.windows.create({
            url: `detail.html?id=${articleId}`,
            type: 'popup',
            width: 800,
            height: 600
        });
    }

    showError(message) {
        const container = document.querySelector('.article-list');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ArticleList();
}); 