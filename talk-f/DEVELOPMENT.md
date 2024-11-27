# Talk-F 开发文档

## 功能概述
Talk-F 是文章发布器，负责文章的创建、编辑和发布管理。

### 核心功能
    - 文章创建编辑
    - 草稿管理
    - 发布控制
    - 多媒体支持

### 技术栈
    - Chrome Extension API
    - Supabase API
    - TinyMCE Editor
    - JavaScript ES6+
    - Markdown Support

## API 接口

### 文章管理
    // 创建文章
    const createArticle = async (article) => {
        try {
            const { data, error } = await supabase
                .from('superbase_articles')
                .insert([{
                    title: article.title,
                    content: article.content,
                    status: 'draft',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('创建文章失败:', error);
            return null;
        }
    };

### 发布控制
    // 发布文章
    const publishArticle = async (articleId) => {
        try {
            const { data, error } = await supabase
                .from('superbase_articles')
                .update({
                    status: 'published',
                    published_at: new Date().toISOString()
                })
                .eq('id', articleId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('发布文章失败:', error);
            return null;
        }
    };

## 数据结构

### 文章格式
    {
        id: number,          // 文章ID
        title: string,       // 标题
        content: string,     // 内容
        status: string,      // 状态：draft, published
        created_at: string,  // 创建时间
        updated_at: string,  // 更新时间
        published_at: string,// 发布时间
        metadata: {          // 元数据
            tags: array,
            category: string,
            author: string
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
1. 文章功能
    - 创建文章
    - 编辑文章
    - 发布文章
    - 草稿保存

2. 编辑器功能
    - 富文本编辑
    - Markdown支持
    - 图片上传
    - 自动保存 