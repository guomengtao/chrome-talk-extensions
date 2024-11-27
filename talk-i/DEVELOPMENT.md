# Talk-I 开发文档

## 功能概述
Talk-I 是文章浏览器，负责提供清晰高效的文章阅读界面。

### 核心功能
    - 文章列表显示
    - 文章详情查看
    - 时间筛选
    - 阅读进度管理

### 技术栈
    - Chrome Extension API
    - Supabase API
    - JavaScript ES6+
    - IndexedDB
    - Virtual Scroll

## API 接口

### 文章列表
    // 获取文章列表
    const getArticles = async (filter = {}) => {
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
            console.error('获取文章列表失败:', error);
            return [];
        }
    };

### 阅读进度
    // 保存阅读进度
    const saveReadingProgress = async (articleId, progress) => {
        try {
            await chrome.storage.local.set({
                [`reading_progress_${articleId}`]: {
                    position: progress.position,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('保存进度失败:', error);
        }
    };

## 数据结构

### 阅读进度格式
    {
        articleId: string,     // 文章ID
        progress: {
            position: number,  // 阅读位置
            timestamp: number, // 时间戳
            duration: number,  // 阅读时长
            completed: boolean // 是否完成
        },
        metadata: {           // 元数据
            device: string,
            session: string,
            marks: array      // 书签
        }
    }

## 开发规范

### 代码风格
    - 使用 ES6+ 语法
    - 异步操作使用 async/await
    - 错误处理使用 try/catch
    - 适当添加注释

### 命名规范
    - 文件名：小写字母，用横线分隔
    - 类名：大驼峰
    - 方法名：小驼峰
    - 常量：大写字母，下划线分隔

## 测试要点
1. 列表功能
    - 分页加载
    - 时间筛选
    - 排序功能
    - 搜索功能

2. 阅读功能
    - 进度保存
    - 书签管理
    - 阅读统计
    - 离线阅读
