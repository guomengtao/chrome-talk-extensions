import { supabase } from './supabase.js';

class ArticleBrowser {
    constructor() {
        this.initSupabase();
    }

    async initSupabase() {
        try {
            // 测试连接
            const { data, error } = await supabase
                .from('superbase_articles')
                .select('count')
                .eq('is_deleted', false);

            if (error) throw error;
            console.log('数据库连接成功，文章数量:', data[0].count);
        } catch (error) {
            console.error('数据库连接失败:', error);
        }
    }

    // 获取文章列表
    async getArticles(filter = {}) {
        try {
            let query = supabase
                .from('superbase_articles')
                .select('id, title, created_at')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (filter.today) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (filter.week) {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('created_at', weekAgo.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取文章失败:', error);
            return [];
        }
    }

    // 获取文章详情
    async getArticle(id) {
        try {
            const { data, error } = await supabase
                .from('superbase_articles')
                .select('*')
                .eq('id', id)
                .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取文章详情失败:', error);
            return null;
        }
    }
}

// 创建实例
const browser = new ArticleBrowser();

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getArticles') {
        browser.getArticles(message.filter).then(sendResponse);
        return true;
    }
    if (message.type === 'getArticle') {
        browser.getArticle(message.id).then(sendResponse);
        return true;
    }
}); 