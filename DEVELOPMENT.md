# 开发文档

## 项目概述
本项目是一个 Chrome 扩展集合，包含 9 个相互关联的扩展程序。

### 数据库配置
- URL: https://tkcrnfgnspvtzwbbvyfv.supabase.co
- API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（完整密钥见 supabase.js）
- 表名: superbase_articles

### 数据库表结构

        CREATE TABLE superbase_articles (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        -- 索引
        CREATE INDEX idx_articles_created_at ON superbase_articles(created_at);
        CREATE INDEX idx_articles_is_deleted ON superbase_articles(is_deleted);

## API 接口说明

### Supabase API
1. 文章操作

        // 获取文章列表
        const { data, error } = await supabase
            .from('superbase_articles')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        // 获取文章详情
        const { data, error } = await supabase
            .from('superbase_articles')
            .select('*')
            .eq('id', articleId)
            .single();

        // 创建文章
        const { data, error } = await supabase
            .from('superbase_articles')
            .insert([{ title, content }])
            .select();

2. 实时订阅

        const channel = supabase.channel('articles-channel')
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'superbase_articles',
                    filter: 'is_deleted=eq.false'
                },
                (payload) => {
                    console.log('文章变更:', payload);
                }
            )
            .subscribe();

### Chrome API
1. 存储 API

        // 保存数据
        chrome.storage.local.set({ key: value });

        // 读取数据
        chrome.storage.local.get(['key'], (result) => {
            console.log(result.key);
        });

2. 消息 API

        // 发送消息
        chrome.runtime.sendMessage({ type: 'messageType', data: data });

        // 接收消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'messageType') {
                // 处理消息
            }
        });

## 插件功能概述

### 消息管理模块
1. Talk-A (消息发送器)
   - [x] 发送消息功能
   - [x] 实时计数器
   - [ ] 消息模板功能
   - [ ] 批量发送功能

2. Talk-B (消息接收器)
   - [x] 接收消息功能
   - [x] 消息通知
   - [ ] 消息过滤器
   - [ ] 高级搜索

[继续其他插件的功能列表...]

## 开发注意事项

### 代码规范
    - 使用 ES6+ 语法
    - 保持模块化结构
    - 添加适当的注释
    - 使用 TypeScript 类型声明

### 安全考虑
    - API 密钥保护
    - 数据验证
    - XSS 防护
    - CORS 策略

### 性能优化
    - 减少 API 调用
    - 使用缓存
    - 延迟加载
    - 压缩资源

## 待办事项

### 高优先级
    - [ ] 完善错误处理机制
    - [ ] 添加单元测试
    - [ ] 优化性能
    - [ ] 改进用户界面

### 中优先级
    - [ ] 添加更多功能
    - [ ] 完善文档
    - [ ] 代码重构
    - [ ] 添加示例