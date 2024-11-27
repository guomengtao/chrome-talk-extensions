import { supabase } from './supabase.js';

class ArticleDetail {
    constructor() {
        this.articleId = new URLSearchParams(window.location.search).get('id');
        this.initUI();
        this.bindEvents();
    }

    async initUI() {
        if (this.articleId) {
            await this.loadArticle();
        }
    }

    bindEvents() {
        document.querySelector('.back-btn').addEventListener('click', () => {
            window.close();
        });
    }

    async loadArticle() {
        try {
            const article = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { type: 'getArticle', id: this.articleId },
                    (response) => resolve(response)
                );
            });

            if (article) {
                this.renderArticle(article);
            } else {
                this.showError('文章不存在或已被删除');
            }
        } catch (error) {
            console.error('加载文章失败:', error);
            this.showError('加载文章失败');
        }
    }

    renderArticle(article) {
        document.querySelector('.article-title').textContent = article.title;
        document.querySelector('.article-time').textContent = 
            new Date(article.created_at).toLocaleString();
        document.querySelector('.article-content').innerHTML = article.content;
    }

    showError(message) {
        document.querySelector('.article-content').innerHTML = 
            `<div class="error-message">${message}</div>`;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ArticleDetail();
}); 